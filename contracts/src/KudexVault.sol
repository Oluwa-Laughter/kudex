// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
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
    IGroth16Verifier public immutable verifier;

    mapping(bytes32 => bool) public commitments;
    mapping(bytes32 => bool) public nullifiers;

    uint256 public riskScore; // Basis points: 0 to 10000
    bool public isDefaulted;
    address public defaultController;

    event DefaultControllerUpdated(address indexed controller);
    error UnauthorizedDefaultController();

    event NoteShielded(bytes32 indexed commitment, uint256 assetAmount, uint256 timestamp);
    event NoteSpent(bytes32 indexed nullifier, bytes32 indexed newCommitment);
    event DefaultTriggered(uint256 remainingAssets, uint256 timestamp);
    event RiskScoreUpdated(uint256 oldScore, uint256 newScore);

    error NullifierAlreadySpent();
    error InvalidZKProof();
    error VaultInDefault();
    error ZeroDepositNotAllowed();
    error InvalidRiskScore();
    error InvalidCommitment();
    error ConfidentialTransfersUnavailable();

    constructor(IERC20 _underlyingAsset, string memory _name, string memory _symbol, address _verifier)
        ERC4626(_underlyingAsset)
        ERC20(_name, _symbol)
        Ownable(msg.sender)
    {
        verifier = IGroth16Verifier(_verifier);
    }

    function shieldDeposit(uint256 assets, bytes32 commitment, address receiver)
        external
        nonReentrant
        returns (uint256 shares)
    {
        if (isDefaulted) revert VaultInDefault();
        if (assets == 0) revert ZeroDepositNotAllowed();

        if (commitment == bytes32(0) || commitments[commitment]) revert InvalidCommitment();
        shares = deposit(assets, receiver);
        commitments[commitment] = true;
        emit NoteShielded(commitment, assets, block.timestamp);
    }

    // Disabled until a reviewed note circuit binds membership, value conservation,
    // nullifier, output commitment and domain. ERC-4626 shares are public balances.
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

    function maxDeposit(address receiver) public view override returns (uint256) {
        return isDefaulted ? 0 : super.maxDeposit(receiver);
    }

    function maxMint(address receiver) public view override returns (uint256) {
        return isDefaulted ? 0 : super.maxMint(receiver);
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
