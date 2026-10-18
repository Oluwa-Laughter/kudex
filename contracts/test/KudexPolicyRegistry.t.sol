// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {TransparentUpgradeableProxy, ITransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import {ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import {KudexPolicyRegistry} from "../src/KudexPolicyRegistry.sol";

contract RegistryV2 is KudexPolicyRegistry { function version() external pure returns (uint256) { return 2; } }
contract KudexPolicyRegistryTest is Test {
    TimelockController timelock;
    KudexPolicyRegistry registry;
    KudexPolicyRegistry implementation;
    ProxyAdmin admin;
    function setUp() public {
        address[] memory members = new address[](1); members[0] = address(this);
        timelock = new TimelockController(2 days, members, members, address(0));
        implementation = new KudexPolicyRegistry();
        registry = KudexPolicyRegistry(address(new TransparentUpgradeableProxy(address(implementation), address(timelock), abi.encodeCall(KudexPolicyRegistry.initialize, (address(timelock))))));
        bytes32 slot = bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);
        admin = ProxyAdmin(address(uint160(uint256(vm.load(address(registry), slot)))));
    }
    function test_InitializationLocked() public {
        vm.expectRevert(); implementation.initialize(address(timelock));
        vm.expectRevert(); registry.initialize(address(timelock));
    }
    function test_AllowlistNeedsDelayedGovernance() public {
        bytes memory data = abi.encodeCall(KudexPolicyRegistry.setVaultApproved, (address(implementation), true));
        vm.expectRevert(KudexPolicyRegistry.Unauthorized.selector); registry.setVaultApproved(address(implementation), true);
        timelock.schedule(address(registry), 0, data, bytes32(0), bytes32(0), 2 days);
        vm.expectRevert(); timelock.execute(address(registry), 0, data, bytes32(0), bytes32(0));
        vm.warp(block.timestamp + 2 days);
        timelock.execute(address(registry), 0, data, bytes32(0), bytes32(0));
        assertTrue(registry.approvedVaults(address(implementation)));
    }
    function test_UpgradeDelayedAndStoragePreserved() public {
        vm.prank(address(timelock)); registry.setVaultApproved(address(implementation), true);
        RegistryV2 replacement = new RegistryV2();
        bytes memory data = abi.encodeCall(ProxyAdmin.upgradeAndCall, (ITransparentUpgradeableProxy(address(registry)), address(replacement), bytes("")));
        vm.expectRevert(); admin.upgradeAndCall(ITransparentUpgradeableProxy(address(registry)), address(replacement), "");
        timelock.schedule(address(admin), 0, data, bytes32(0), bytes32("upgrade-2"), 2 days);
        vm.expectRevert(); timelock.execute(address(admin), 0, data, bytes32(0), bytes32("upgrade-2"));
        vm.warp(block.timestamp + 2 days);
        timelock.execute(address(admin), 0, data, bytes32(0), bytes32("upgrade-2"));
        assertEq(RegistryV2(address(registry)).version(), 2);
        assertEq(registry.governor(), address(timelock));
        assertTrue(registry.approvedVaults(address(implementation)));
        assertEq(admin.owner(), address(timelock));
    }
}
