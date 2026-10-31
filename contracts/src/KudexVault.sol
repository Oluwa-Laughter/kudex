// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IGroth16Verifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[2] calldata input
    ) external view returns (bool);
}

contract KudexVault is ERC4626, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_BATCH_NOTES = 50;

    struct BatchShieldItem {
        uint256 assets;
        bytes32 commitment;
        address receiver;
        bytes encryptedMemo;
    }

    struct BatchConfidentialItem {
        bytes32 nullifier;
        bytes32 newCommitment;
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256[2] publicInputs;
        address noteOwner;
        bytes encryptedMemo;
    }

    IGroth16Verifier public immutable verifier;

    mapping(bytes32 => bool) public commitments;
    mapping(bytes32 => bool) public nullifiers;

    uint256 public riskScore; // Basis points: 0 to 10000
    bool public isDefaulted;
    address public defaultController;
    bool public confidentialNoteCircuitEnabled;
    uint256 public totalYieldDistributed;

    event DefaultControllerUpdated(address indexed controller);
    event ConfidentialNoteCircuitUpdated(bool enabled);
    error UnauthorizedDefaultController();

    event NoteShielded(bytes32 indexed commitment, uint256 assetAmount, uint256 timestamp);
    event NoteSpent(bytes32 indexed nullifier, bytes32 indexed newCommitment);
    event EncryptedNoteSynced(
        address indexed owner,
        bytes32 indexed commitment,
        bytes encryptedMemo,
        uint256 timestamp
    );
    event BatchNotesShielded(address indexed sender, uint256 count, uint256 totalAssets, uint256 timestamp);
    event BatchConfidentialTransferExecuted(address indexed sender, uint256 count, uint256 timestamp);
    event YieldDistributed(address indexed source, uint256 yieldAssets, uint256 newTotalAssets, uint256 timestamp);
    event DefaultTriggered(uint256 remainingAssets, uint256 timestamp);
    event RiskScoreUpdated(uint256 oldScore, uint256 newScore);

    error NullifierAlreadySpent();
    error InvalidZKProof();
    error VaultInDefault();
    error ZeroDepositNotAllowed();
    error InvalidRiskScore();
    error InvalidCommitment();
    error ConfidentialTransfersUnavailable();
    error InexactAssetTransfer();
    error MinimumOutputNotMet();
    error TransactionExpired();
    error BatchSizeInvalid();
    error InvalidReceiver();

    constructor(IERC20 _underlyingAsset, string memory _name, string memory _symbol, address _verifier)
        ERC4626(_underlyingAsset)
        ERC20(_name, _symbol)
        Ownable(msg.sender)
    {
        verifier = IGroth16Verifier(_verifier);
    }

    function shieldDeposit(uint256 assets, bytes32 commitment, address receiver)
        external
        returns (uint256 shares)
    {
        return _shieldDeposit(assets, commitment, receiver, "");
    }

    function shieldDeposit(
        uint256 assets,
        bytes32 commitment,
        address receiver,
        bytes calldata encryptedMemo
    ) external returns (uint256 shares) {
        return _shieldDeposit(assets, commitment, receiver, encryptedMemo);
    }

    function batchShieldDeposit(BatchShieldItem[] calldata items) external returns (uint256 totalShares) {
        uint256 count = items.length;
        if (count == 0 || count > MAX_BATCH_NOTES) revert BatchSizeInvalid();
        if (isDefaulted) revert VaultInDefault();

        uint256 totalShieldedAssets = 0;
        for (uint256 i = 0; i < count; ++i) {
            BatchShieldItem calldata item = items[i];
            if (item.receiver == address(0)) revert InvalidReceiver();
            uint256 shares = _shieldDeposit(item.assets, item.commitment, item.receiver, item.encryptedMemo);
            totalShares += shares;
            totalShieldedAssets += item.assets;
        }

        emit BatchNotesShielded(msg.sender, count, totalShieldedAssets, block.timestamp);
    }

    function _shieldDeposit(
        uint256 assets,
        bytes32 commitment,
        address receiver,
        bytes memory encryptedMemo
    ) internal returns (uint256 shares) {
        if (isDefaulted) revert VaultInDefault();
        if (assets == 0) revert ZeroDepositNotAllowed();
        if (commitment == bytes32(0) || commitments[commitment]) revert InvalidCommitment();

        shares = deposit(assets, receiver);
        commitments[commitment] = true;
        emit NoteShielded(commitment, assets, block.timestamp);

        if (encryptedMemo.length > 0) {
            emit EncryptedNoteSynced(receiver, commitment, encryptedMemo, block.timestamp);
            if (msg.sender != receiver) {
                emit EncryptedNoteSynced(msg.sender, commitment, encryptedMemo, block.timestamp);
            }
        }
    }

    // Legacy 6-argument entry point remains disabled unless an encrypted memo / enabled note circuit is used.
    function confidentialTransfer(
        bytes32,
        bytes32,
        uint256[2] calldata,
        uint256[2][2] calldata,
        uint256[2] calldata,
        uint256[2] calldata
    ) external pure {
        revert ConfidentialTransfersUnavailable();
    }

    /// @notice Spend an existing note nullifier and register a new commitment with optional encrypted backup memo.
    function confidentialTransfer(
        bytes32 nullifier,
        bytes32 newCommitment,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[2] calldata publicInputs,
        bytes calldata encryptedMemo
    ) external nonReentrant {
        if (!confidentialNoteCircuitEnabled || address(verifier) == address(0)) {
            revert ConfidentialTransfersUnavailable();
        }
        if (isDefaulted) revert VaultInDefault();
        _verifyAndSpendNote(nullifier, newCommitment, a, b, c, publicInputs, msg.sender, encryptedMemo);
    }

    /// @notice Atomically settle up to 50 confidential note transfers in a single transaction.
    function batchConfidentialTransfer(BatchConfidentialItem[] calldata items) external nonReentrant {
        uint256 count = items.length;
        if (count == 0 || count > MAX_BATCH_NOTES) revert BatchSizeInvalid();
        if (!confidentialNoteCircuitEnabled || address(verifier) == address(0)) {
            revert ConfidentialTransfersUnavailable();
        }
        if (isDefaulted) revert VaultInDefault();

        for (uint256 i = 0; i < count; ++i) {
            BatchConfidentialItem calldata item = items[i];
            address syncOwner = item.noteOwner == address(0) ? msg.sender : item.noteOwner;
            _verifyAndSpendNote(
                item.nullifier,
                item.newCommitment,
                item.a,
                item.b,
                item.c,
                item.publicInputs,
                syncOwner,
                item.encryptedMemo
            );
        }

        emit BatchConfidentialTransferExecuted(msg.sender, count, block.timestamp);
    }

    function _verifyAndSpendNote(
        bytes32 nullifier,
        bytes32 newCommitment,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[2] calldata publicInputs,
        address syncOwner,
        bytes calldata encryptedMemo
    ) internal {
        if (nullifier == bytes32(0) || nullifiers[nullifier]) revert NullifierAlreadySpent();
        if (newCommitment == bytes32(0) || commitments[newCommitment]) revert InvalidCommitment();
        if (publicInputs[0] != uint256(nullifier) || publicInputs[1] != uint256(newCommitment)) {
            revert InvalidZKProof();
        }
        if (!verifier.verifyProof(a, b, c, publicInputs)) revert InvalidZKProof();

        nullifiers[nullifier] = true;
        commitments[newCommitment] = true;
        emit NoteSpent(nullifier, newCommitment);

        if (encryptedMemo.length > 0) {
            emit EncryptedNoteSynced(syncOwner, newCommitment, encryptedMemo, block.timestamp);
        }
    }

    /// @notice Routes protocol fee revenue directly into vault underlying assets, raising share value for depositors.
    function distributeYield(uint256 yieldAssets) external nonReentrant {
        if (isDefaulted) revert VaultInDefault();
        if (yieldAssets == 0) revert ZeroDepositNotAllowed();

        IERC20 underlying = IERC20(asset());
        uint256 beforeAssets = underlying.balanceOf(address(this));
        underlying.safeTransferFrom(msg.sender, address(this), yieldAssets);
        uint256 afterAssets = underlying.balanceOf(address(this));
        if (afterAssets != beforeAssets + yieldAssets) revert InexactAssetTransfer();

        totalYieldDistributed += yieldAssets;
        emit YieldDistributed(msg.sender, yieldAssets, afterAssets, block.timestamp);
    }

    /// @notice Underlying assets backing 1 full vault share (`10 ** decimals()`).
    function exchangeRatePerShare() external view returns (uint256) {
        return convertToAssets(10 ** decimals());
    }

    /// @notice Public ERC-4626 deposit with user-specified share floor and expiry.
    function depositWithMinimum(uint256 assets, address receiver, uint256 minShares, uint256 deadline)
        external
        returns (uint256 shares)
    {
        if (block.timestamp > deadline) revert TransactionExpired();
        if (assets == 0 || minShares == 0) revert ZeroDepositNotAllowed();
        shares = deposit(assets, receiver);
        if (shares < minShares) revert MinimumOutputNotMet();
    }

    /// @notice Redeem the caller's shares with a minimum asset return.
    function redeemWithMinimum(uint256 shares, address receiver, uint256 minAssets, uint256 deadline)
        external
        returns (uint256 assets)
    {
        if (block.timestamp > deadline) revert TransactionExpired();
        if (shares == 0 || minAssets == 0) revert ZeroDepositNotAllowed();
        assets = redeem(shares, receiver, msg.sender);
        if (assets < minAssets) revert MinimumOutputNotMet();
    }

    // All standard and bounded entry points share the same transfer guard.
    // Fee-on-transfer and rebasing assets are unsupported.
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares)
        internal
        override
        nonReentrant
    {
        if (assets == 0 || shares == 0) revert ZeroDepositNotAllowed();
        uint256 beforeAssets = IERC20(asset()).balanceOf(address(this));
        super._deposit(caller, receiver, assets, shares);
        if (IERC20(asset()).balanceOf(address(this)) != beforeAssets + assets) revert InexactAssetTransfer();
    }

    function _withdraw(address caller, address receiver, address owner_, uint256 assets, uint256 shares)
        internal
        override
        nonReentrant
    {
        uint256 beforeAssets = IERC20(asset()).balanceOf(address(this));
        uint256 beforeReceiver = IERC20(asset()).balanceOf(receiver);
        super._withdraw(caller, receiver, owner_, assets, shares);
        if (
            IERC20(asset()).balanceOf(address(this)) + assets != beforeAssets
                || IERC20(asset()).balanceOf(receiver) != beforeReceiver + assets
        ) revert InexactAssetTransfer();
    }

    function maxDeposit(address receiver) public view override returns (uint256) {
        return isDefaulted ? 0 : super.maxDeposit(receiver);
    }

    function maxMint(address receiver) public view override returns (uint256) {
        return isDefaulted ? 0 : super.maxMint(receiver);
    }

    function setConfidentialNoteCircuitEnabled(bool enabled) external onlyOwner {
        confidentialNoteCircuitEnabled = enabled;
        emit ConfidentialNoteCircuitUpdated(enabled);
    }

    function setRiskScore(uint256 _newScore) external onlyOwner {
        if (_newScore > 10000) revert InvalidRiskScore();
        emit RiskScoreUpdated(riskScore, _newScore);
        riskScore = _newScore;
    }

    function setDefaultController(address controller) external onlyOwner {
        defaultController = controller;
        emit DefaultControllerUpdated(controller);
    }

    function triggerDefault() external {
        if (msg.sender != owner() && msg.sender != defaultController) revert UnauthorizedDefaultController();
        isDefaulted = true;
        emit DefaultTriggered(totalAssets(), block.timestamp);
    }
}
