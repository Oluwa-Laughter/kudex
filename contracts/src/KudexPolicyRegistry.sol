// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/// @notice Upgradeable allowlist only. Holds no tokens and cannot change executor policies.
/// @dev Deploy behind a transparent proxy; governor and proxy admin owner must be a timelock.
contract KudexPolicyRegistry is Initializable {
    address public governor;
    mapping(address => bool) public approvedVaults;
    uint256[48] private __gap;

    error Unauthorized();
    error InvalidGovernor();
    error InvalidVault();
    event VaultApprovalChanged(address indexed vault, bool approved);

    constructor() { _disableInitializers(); }

    function initialize(address timelock) external initializer {
        if (timelock.code.length == 0) revert InvalidGovernor();
        governor = timelock;
    }

    function setVaultApproved(address vault, bool approved) external {
        if (msg.sender != governor) revert Unauthorized();
        if (approved && vault.code.length == 0) revert InvalidVault();
        approvedVaults[vault] = approved;
        emit VaultApprovalChanged(vault, approved);
    }
}
