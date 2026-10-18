// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Script} from "forge-std/Script.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import {KudexPolicyRegistry} from "../src/KudexPolicyRegistry.sol";
import {KudexAgentExecutor} from "../src/KudexAgentExecutor.sol";

/// @notice Opt-in testnet infrastructure only. Vault approval is a separately scheduled timelock action.
contract DeployAgentInfrastructure is Script {
    function run() external returns (TimelockController timelock, address registry, KudexAgentExecutor executor) {
        require(block.chainid == 420420777, "Portaldot V3 testnet only");
        address governor = vm.envAddress("KUDEX_GOVERNOR_ADDRESS");
        require(governor != address(0), "Governor required");
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = governor;
        executors[0] = governor;
        vm.startBroadcast();
        // No bootstrap admin: all role changes must go through the timelock itself.
        timelock = new TimelockController(2 days, proposers, executors, address(0));
        KudexPolicyRegistry implementation = new KudexPolicyRegistry();
        registry = address(new TransparentUpgradeableProxy(address(implementation), address(timelock), abi.encodeCall(KudexPolicyRegistry.initialize, (address(timelock)))));
        executor = new KudexAgentExecutor(registry);
        vm.stopBroadcast();
    }
}
