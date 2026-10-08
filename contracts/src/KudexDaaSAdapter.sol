// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {KudexVault} from "./KudexVault.sol";

/**
 * @title KudexDaaSAdapter
 * @notice Portaldot Default-as-a-Service (DaaS) Automated Debt Restructuring & Sentinel Hook
 * @dev Coordinates algorithmic liquidation cascades and autonomous restructuring when RWA vault risk exceeds bounds.
 */
contract KudexDaaSAdapter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant CRITICAL_RISK_THRESHOLD = 8500; // 85.00% in bps
    uint256 public constant BPS_DENOMINATOR = 10000;

    struct VaultProfile {
        bool isRegistered;
        uint256 lastAssessmentTimestamp;
        uint256 totalRestructuredDebt;
        uint256 collateralizationRatioBps; // e.g. 12000 = 120%
        bool restructuringActive;
    }

    mapping(address => VaultProfile) public vaultProfiles;
    mapping(address => bool) public authorizedSentinels;
    address[] public registeredVaults;

    event VaultRegistered(address indexed vault, uint256 initialCollateralRatio);
    event SentinelUpdated(address indexed sentinel, bool authorized);
    event HealthFactorEvaluated(address indexed vault, uint256 riskScore, uint256 healthFactorBps);
    event DebtRestructured(address indexed vault, uint256 recoveredAssets, uint256 timestamp);
    event LiquidationCascadeTriggered(address indexed vault, uint256 totalAssetsAffected, uint256 timestamp);

    error VaultAlreadyRegistered();
    error VaultNotRegistered();
    error UnauthorizedSentinel();
    error InvalidParameters();

    modifier onlySentinelOrOwner() {
        if (msg.sender != owner() && !authorizedSentinels[msg.sender]) {
            revert UnauthorizedSentinel();
        }
        _;
    }

    constructor() Ownable(msg.sender) {
        authorizedSentinels[msg.sender] = true;
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

    function calculateHealthFactor(address vault) public view returns (uint256 healthFactorBps) {
        VaultProfile memory profile = vaultProfiles[vault];
        if (!profile.isRegistered) revert VaultNotRegistered();

        KudexVault kv = KudexVault(vault);
        uint256 currentRisk = kv.riskScore();
        if (kv.isDefaulted()) {
            return 0;
        }

        if (currentRisk >= BPS_DENOMINATOR) {
            return 0;
        }

        // Health factor: inversely proportional to riskScore
        healthFactorBps = ((BPS_DENOMINATOR - currentRisk) * profile.collateralizationRatioBps) / BPS_DENOMINATOR;
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
            profile.restructuringActive = true;
            uint256 vaultAssets = kv.totalAssets();

            profile.totalRestructuredDebt += vaultAssets;
            emit LiquidationCascadeTriggered(vault, vaultAssets, block.timestamp);
            emit DebtRestructured(vault, vaultAssets, block.timestamp);

            // Trigger on-chain default hook on KudexVault
            kv.triggerDefault();
        }
    }

    function getRegisteredVaultsCount() external view returns (uint256) {
        return registeredVaults.length;
    }
}
