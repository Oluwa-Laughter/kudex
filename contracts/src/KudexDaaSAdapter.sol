// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {KudexVault} from "./KudexVault.sol";

/**
 * @title KudexDaaSAdapter
 * @notice Portaldot 5-Stage Default-as-a-Service (DaaS) Recovery Engine, Sentinel Hook & Protection Reserve.
 * @dev Models Portaldot's full 5-stage protection lifecycle:
 *      Stage 1: Triggered -> Stage 2: Validated -> Stage 3: AssetsControlled ->
 *      Stage 4: LossAllocated -> Stage 5: RecoveryActive (pro-rata claimRecoveryShare).
 */
contract KudexDaaSAdapter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant CRITICAL_RISK_THRESHOLD = 8500; // 85.00% in bps
    uint256 public constant BPS_DENOMINATOR = 10000;
    address private constant BURN_SINK = 0x000000000000000000000000000000000000dEaD;

    enum DaaSStage {
        Healthy,          // 0
        Triggered,        // 1: Risk threshold crossed or missed invoice obligation
        Validated,        // 2: On-chain obligation check confirmed
        AssetsControlled, // 3: Vault deposits paused, remaining collateral locked
        LossAllocated,    // 4: Safety reserve funds merged with remaining vault collateral
        RecoveryActive    // 5: Share holders call claimRecoveryShare(shares)
    }

    struct VaultProfile {
        bool isRegistered;
        uint256 lastAssessmentTimestamp;
        uint256 totalRestructuredDebt;
        uint256 collateralizationRatioBps; // e.g. 12000 = 120%
        bool restructuringActive;
    }

    struct DaaSRecoveryState {
        DaaSStage stage;
        uint256 snapshotShares;
        uint256 reserveCommitted;
        uint256 reserveClaimed;
        uint256 vaultCollateralAtLock;
        uint256 updatedAt;
        bytes32 obligationRef;
    }

    mapping(address => VaultProfile) public vaultProfiles;
    mapping(address => DaaSRecoveryState) public vaultRecoveryStates;
    mapping(address => bool) public authorizedSentinels;
    mapping(address => uint256) public reserveBalances;
    mapping(address => uint256) public totalReserveFunded;
    address[] public registeredVaults;

    event VaultRegistered(address indexed vault, uint256 initialCollateralRatio);
    event SentinelUpdated(address indexed sentinel, bool authorized);
    event HealthFactorEvaluated(address indexed vault, uint256 riskScore, uint256 healthFactorBps);
    event DebtRestructured(address indexed vault, uint256 recoveredAssets, uint256 timestamp);
    event DefaultEnforced(address indexed vault, uint256 assetsAtFreeze, uint256 timestamp);
    event LiquidationCascadeTriggered(address indexed vault, uint256 totalAssetsAffected, uint256 timestamp);
    event ProtectionReserveFunded(address indexed source, address indexed token, uint256 amount, uint256 newBalance);
    event ReserveFunded(
        address indexed source,
        address indexed token,
        uint256 amount,
        uint256 newBalance,
        uint256 timestamp
    );
    event DaaSStageAdvanced(
        address indexed vault,
        uint8 stage,
        uint256 reserveCommitted,
        uint256 timestamp
    );
    event RecoveryShareClaimed(
        address indexed vault,
        address indexed account,
        uint256 sharesBurned,
        uint256 vaultAssetsReturned,
        uint256 reserveAssetsReturned,
        uint256 timestamp
    );

    error VaultAlreadyRegistered();
    error VaultNotRegistered();
    error UnauthorizedSentinel();
    error InvalidParameters();
    error InexactReserveTransfer();
    error InvalidDaaSTransition();
    error RecoveryNotActive();
    error NoSharesToClaim();

    modifier onlySentinelOrOwner() {
        if (msg.sender != owner() && !authorizedSentinels[msg.sender]) {
            revert UnauthorizedSentinel();
        }
        _;
    }

    constructor(address initialVault) Ownable(msg.sender) {
        authorizedSentinels[msg.sender] = true;
        if (initialVault != address(0)) {
            vaultProfiles[initialVault] = VaultProfile({
                isRegistered: true,
                lastAssessmentTimestamp: block.timestamp,
                totalRestructuredDebt: 0,
                collateralizationRatioBps: 12000,
                restructuringActive: false
            });
            registeredVaults.push(initialVault);
            emit VaultRegistered(initialVault, 12000);
        }
    }

    function setSentinel(address sentinel, bool authorized) external onlyOwner {
        if (sentinel == address(0)) revert InvalidParameters();
        authorizedSentinels[sentinel] = authorized;
        emit SentinelUpdated(sentinel, authorized);
    }

    function registerVault(address vault, uint256 collateralRatioBps) external onlyOwner {
        if (vault == address(0)) revert InvalidParameters();
        if (vaultProfiles[vault].isRegistered) revert VaultAlreadyRegistered();

        vaultProfiles[vault] = VaultProfile({
            isRegistered: true,
            lastAssessmentTimestamp: block.timestamp,
            totalRestructuredDebt: 0,
            collateralizationRatioBps: collateralRatioBps,
            restructuringActive: false
        });

        registeredVaults.push(vault);
        emit VaultRegistered(vault, collateralRatioBps);
    }

    /// @notice Receives protocol fee allocations into the Payment Protection Reserve.
    function fundReserve(address token, uint256 amount) external nonReentrant {
        if (token == address(0) || amount == 0) revert InvalidParameters();

        IERC20 asset = IERC20(token);
        uint256 beforeBal = asset.balanceOf(address(this));
        asset.safeTransferFrom(msg.sender, address(this), amount);
        uint256 afterBal = asset.balanceOf(address(this));
        if (afterBal != beforeBal + amount) revert InexactReserveTransfer();

        reserveBalances[token] += amount;
        totalReserveFunded[token] += amount;
        emit ProtectionReserveFunded(msg.sender, token, amount, reserveBalances[token]);
        emit ReserveFunded(msg.sender, token, amount, reserveBalances[token], block.timestamp);
    }

    function getReserveBalance(address token) external view returns (uint256) {
        return reserveBalances[token];
    }

    function calculateHealthFactor(address vault) public view returns (uint256 healthFactorBps) {
        VaultProfile memory profile = vaultProfiles[vault];
        if (!profile.isRegistered) revert VaultNotRegistered();

        KudexVault kv = KudexVault(vault);
        uint256 currentRisk = kv.riskScore();
        if (kv.isDefaulted() || vaultRecoveryStates[vault].stage >= DaaSStage.AssetsControlled) {
            return 0;
        }

        if (currentRisk >= BPS_DENOMINATOR) {
            return 0;
        }

        healthFactorBps = ((BPS_DENOMINATOR - currentRisk) * profile.collateralizationRatioBps) / BPS_DENOMINATOR;
    }

    /// @notice Stage 1 entry point: Trigger DaaS pipeline on risk threshold breach or missed invoice obligation.
    function triggerDaaS(address vault, bytes32 obligationRef) external nonReentrant onlySentinelOrOwner {
        VaultProfile storage profile = vaultProfiles[vault];
        if (!profile.isRegistered) revert VaultNotRegistered();

        DaaSRecoveryState storage state = vaultRecoveryStates[vault];
        if (state.stage != DaaSStage.Healthy) revert InvalidDaaSTransition();

        KudexVault kv = KudexVault(vault);
        if (kv.riskScore() < CRITICAL_RISK_THRESHOLD && obligationRef == bytes32(0) && !kv.isDefaulted()) {
            revert InvalidDaaSTransition();
        }

        profile.lastAssessmentTimestamp = block.timestamp;
        state.stage = DaaSStage.Triggered;
        state.obligationRef = obligationRef;
        state.updatedAt = block.timestamp;

        emit DaaSStageAdvanced(vault, uint8(DaaSStage.Triggered), 0, block.timestamp);
    }

    /// @notice Advances a vault sequentially through Portaldot's 5-stage DaaS recovery pipeline.
    function advanceDaaSStage(address vault) external nonReentrant onlySentinelOrOwner returns (uint8 newStage) {
        VaultProfile storage profile = vaultProfiles[vault];
        if (!profile.isRegistered) revert VaultNotRegistered();

        DaaSRecoveryState storage state = vaultRecoveryStates[vault];
        KudexVault kv = KudexVault(vault);

        if (state.stage == DaaSStage.Healthy) {
            if (kv.riskScore() < CRITICAL_RISK_THRESHOLD && !kv.isDefaulted()) {
                revert InvalidDaaSTransition();
            }
            state.stage = DaaSStage.Triggered;
            state.updatedAt = block.timestamp;
            emit DaaSStageAdvanced(vault, uint8(DaaSStage.Triggered), 0, block.timestamp);
            return uint8(DaaSStage.Triggered);
        }

        if (state.stage == DaaSStage.Triggered) {
            if (kv.riskScore() < CRITICAL_RISK_THRESHOLD && state.obligationRef == bytes32(0) && !kv.isDefaulted()) {
                revert InvalidDaaSTransition();
            }
            state.stage = DaaSStage.Validated;
            state.updatedAt = block.timestamp;
            emit DaaSStageAdvanced(vault, uint8(DaaSStage.Validated), 0, block.timestamp);
            return uint8(DaaSStage.Validated);
        }

        if (state.stage == DaaSStage.Validated) {
            uint256 vaultAssets = kv.totalAssets();
            if (!kv.isDefaulted()) {
                kv.triggerDefault();
                emit DefaultEnforced(vault, vaultAssets, block.timestamp);
            }
            profile.restructuringActive = true;
            state.vaultCollateralAtLock = vaultAssets;
            state.stage = DaaSStage.AssetsControlled;
            state.updatedAt = block.timestamp;
            emit DaaSStageAdvanced(vault, uint8(DaaSStage.AssetsControlled), 0, block.timestamp);
            return uint8(DaaSStage.AssetsControlled);
        }

        if (state.stage == DaaSStage.AssetsControlled) {
            address asset = kv.asset();
            uint256 availableReserve = reserveBalances[asset];
            if (availableReserve > 0) {
                reserveBalances[asset] = 0;
                state.reserveCommitted += availableReserve;
                profile.totalRestructuredDebt += availableReserve;
                emit DebtRestructured(vault, availableReserve, block.timestamp);
            }
            state.stage = DaaSStage.LossAllocated;
            state.updatedAt = block.timestamp;
            emit DaaSStageAdvanced(vault, uint8(DaaSStage.LossAllocated), state.reserveCommitted, block.timestamp);
            return uint8(DaaSStage.LossAllocated);
        }

        if (state.stage == DaaSStage.LossAllocated) {
            state.snapshotShares = kv.totalSupply();
            state.stage = DaaSStage.RecoveryActive;
            state.updatedAt = block.timestamp;
            emit DaaSStageAdvanced(vault, uint8(DaaSStage.RecoveryActive), state.reserveCommitted, block.timestamp);
            return uint8(DaaSStage.RecoveryActive);
        }

        revert InvalidDaaSTransition();
    }

    function evaluateAndEnforce(address vault) external nonReentrant onlySentinelOrOwner {
        VaultProfile storage profile = vaultProfiles[vault];
        if (!profile.isRegistered) revert VaultNotRegistered();

        KudexVault kv = KudexVault(vault);
        uint256 risk = kv.riskScore();
        uint256 hf = calculateHealthFactor(vault);

        profile.lastAssessmentTimestamp = block.timestamp;
        emit HealthFactorEvaluated(vault, risk, hf);

        if (risk >= CRITICAL_RISK_THRESHOLD && !kv.isDefaulted()) {
            uint256 vaultAssets = kv.totalAssets();
            kv.triggerDefault();
            emit DefaultEnforced(vault, vaultAssets, block.timestamp);

            DaaSRecoveryState storage state = vaultRecoveryStates[vault];
            if (state.stage == DaaSStage.Healthy) {
                emit DaaSStageAdvanced(vault, uint8(DaaSStage.Triggered), 0, block.timestamp);
                emit DaaSStageAdvanced(vault, uint8(DaaSStage.Validated), 0, block.timestamp);
                state.stage = DaaSStage.AssetsControlled;
                state.vaultCollateralAtLock = vaultAssets;
                state.updatedAt = block.timestamp;
                profile.restructuringActive = true;
                emit DaaSStageAdvanced(vault, uint8(DaaSStage.AssetsControlled), 0, block.timestamp);
            }
        }
    }

    /// @notice Stage 5 recovery withdrawal on the primary registered vault.
    function claimRecoveryShare(uint256 shares) external nonReentrant returns (uint256 totalRecovered) {
        if (registeredVaults.length == 0) revert VaultNotRegistered();
        return _claimRecoveryShare(registeredVaults[0], shares);
    }

    /// @notice Stage 5 recovery withdrawal on a specific registered vault.
    function claimRecoveryShare(address vault, uint256 shares) external nonReentrant returns (uint256 totalRecovered) {
        return _claimRecoveryShare(vault, shares);
    }

    function _claimRecoveryShare(address vault, uint256 shares) internal returns (uint256 totalRecovered) {
        if (!vaultProfiles[vault].isRegistered) revert VaultNotRegistered();
        if (shares == 0) revert NoSharesToClaim();

        DaaSRecoveryState storage state = vaultRecoveryStates[vault];
        if (state.stage != DaaSStage.RecoveryActive) revert RecoveryNotActive();
        if (shares > state.snapshotShares) revert InvalidParameters();

        KudexVault kv = KudexVault(vault);
        uint256 unclaimedReserve = state.reserveCommitted - state.reserveClaimed;
        uint256 reservePayout = (unclaimedReserve * shares) / state.snapshotShares;

        state.snapshotShares -= shares;
        state.reserveClaimed += reservePayout;
        state.updatedAt = block.timestamp;

        uint256 vaultPayout = 0;
        if (kv.totalAssets() > 0 && kv.previewRedeem(shares) > 0) {
            vaultPayout = kv.redeem(shares, msg.sender, msg.sender);
        } else {
            IERC20(vault).safeTransferFrom(msg.sender, BURN_SINK, shares);
        }

        if (reservePayout > 0) {
            IERC20(kv.asset()).safeTransfer(msg.sender, reservePayout);
        }

        totalRecovered = vaultPayout + reservePayout;
        emit RecoveryShareClaimed(vault, msg.sender, shares, vaultPayout, reservePayout, block.timestamp);
    }

    function getDaaSRecoveryState(address vault) external view returns (DaaSRecoveryState memory) {
        return vaultRecoveryStates[vault];
    }

    function previewRecoveryClaim(address vault, uint256 shares)
        external
        view
        returns (uint256 vaultAssets, uint256 reserveAssets, uint256 totalAssetsOut)
    {
        DaaSRecoveryState memory state = vaultRecoveryStates[vault];
        if (state.stage != DaaSStage.RecoveryActive || shares == 0 || shares > state.snapshotShares) {
            return (0, 0, 0);
        }
        KudexVault kv = KudexVault(vault);
        vaultAssets = kv.totalAssets() > 0 ? kv.previewRedeem(shares) : 0;
        uint256 unclaimedReserve = state.reserveCommitted - state.reserveClaimed;
        reserveAssets = (unclaimedReserve * shares) / state.snapshotShares;
        totalAssetsOut = vaultAssets + reserveAssets;
    }

    function getRegisteredVaultsCount() external view returns (uint256) {
        return registeredVaults.length;
    }
}
