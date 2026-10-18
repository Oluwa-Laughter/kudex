// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IKudexPolicyRegistry { function approvedVaults(address vault) external view returns (bool); }

/// @notice Immutable, deposit-only delegate executor. No arbitrary calls or withdrawals.
contract KudexAgentExecutor is ReentrancyGuard {
    using SafeERC20 for IERC20;
    IKudexPolicyRegistry public immutable registry;
    uint256 public nextPolicyId;
    uint256 public constant MAX_DURATION = 30 days;

    struct Policy {
        address owner;
        address delegate;
        address vault;
        address asset;
        uint64 expiresAt;
        bool revoked;
        uint256 perActionCap;
        uint256 dailyCap;
        uint256 totalCap;
        uint256 spent;
        uint256 day;
        uint256 daySpent;
    }
    mapping(bytes32 => Policy) public policies;
    error InvalidPolicy();
    error Unauthorized();
    error InactivePolicy();
    error LimitExceeded();
    error VaultUnavailable();
    error UnsupportedAsset();
    error NoSharesReceived();
    event PolicyCreated(bytes32 indexed policyId, address indexed owner, address indexed delegate, address vault, uint64 expiresAt);
    event PolicyRevoked(bytes32 indexed policyId);
    event DepositExecuted(bytes32 indexed policyId, uint256 assets, uint256 shares);

    constructor(address policyRegistry) {
        if (policyRegistry.code.length == 0) revert InvalidPolicy();
        registry = IKudexPolicyRegistry(policyRegistry);
    }

    function createPolicy(address delegate, address vault, uint64 expiresAt, uint256 perActionCap, uint256 dailyCap, uint256 totalCap)
        external returns (bytes32 id)
    {
        if (delegate == address(0) || delegate == msg.sender || expiresAt <= block.timestamp
            || expiresAt > block.timestamp + MAX_DURATION || perActionCap == 0
            || perActionCap > dailyCap || dailyCap > totalCap) revert InvalidPolicy();
        if (!registry.approvedVaults(vault)) revert VaultUnavailable();
        address asset = IERC4626(vault).asset();
        if (asset.code.length == 0) revert UnsupportedAsset();
        id = keccak256(abi.encode(block.chainid, address(this), msg.sender, nextPolicyId++));
        policies[id] = Policy(msg.sender, delegate, vault, asset, expiresAt, false, perActionCap, dailyCap, totalCap, 0, block.timestamp / 1 days, 0);
        emit PolicyCreated(id, msg.sender, delegate, vault, expiresAt);
    }

    function revokePolicy(bytes32 id) external {
        Policy storage policy = policies[id];
        if (msg.sender != policy.owner) revert Unauthorized();
        policy.revoked = true;
        emit PolicyRevoked(id);
    }

    function execute(bytes32 id, uint256 assets) external nonReentrant returns (uint256 shares) {
        Policy storage policy = policies[id];
        if (msg.sender != policy.delegate) revert Unauthorized();
        if (policy.revoked || block.timestamp >= policy.expiresAt) revert InactivePolicy();
        if (!registry.approvedVaults(policy.vault) || IERC4626(policy.vault).asset() != policy.asset) revert VaultUnavailable();
        uint256 today = block.timestamp / 1 days;
        if (policy.day != today) { policy.day = today; policy.daySpent = 0; }
        if (assets == 0 || assets > policy.perActionCap || assets > policy.totalCap - policy.spent
            || assets > policy.dailyCap - policy.daySpent) revert LimitExceeded();
        policy.spent += assets;
        policy.daySpent += assets;
        IERC20 token = IERC20(policy.asset);
        uint256 beforeAssets = token.balanceOf(address(this));
        uint256 beforeShares = IERC20(policy.vault).balanceOf(policy.owner);
        token.safeTransferFrom(policy.owner, address(this), assets);
        if (token.balanceOf(address(this)) - beforeAssets != assets) revert UnsupportedAsset();
        token.forceApprove(policy.vault, assets);
        shares = IERC4626(policy.vault).deposit(assets, policy.owner);
        token.forceApprove(policy.vault, 0);
        if (shares == 0 || IERC20(policy.vault).balanceOf(policy.owner) - beforeShares != shares) revert NoSharesReceived();
        if (token.balanceOf(address(this)) != beforeAssets) revert UnsupportedAsset();
        emit DepositExecuted(id, assets, shares);
    }
}
