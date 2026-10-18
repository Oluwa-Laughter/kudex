// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import {KudexPolicyRegistry} from "../src/KudexPolicyRegistry.sol";
import {KudexAgentExecutor} from "../src/KudexAgentExecutor.sol";
import {KudexVault} from "../src/KudexVault.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract KudexAgentExecutorTest is Test {
    KudexPolicyRegistry registry;
    KudexAgentExecutor executor;
    KudexVault vault;
    MockERC20 token;
    address owner = address(0xA11CE);
    address delegate = address(0xB0B);
    bytes32 id;
    function setUp() public {
        vm.warp(2 days);
        registry = KudexPolicyRegistry(address(new TransparentUpgradeableProxy(address(new KudexPolicyRegistry()), address(this), abi.encodeCall(KudexPolicyRegistry.initialize, (address(this))))));
        token = new MockERC20("Test", "TEST", 6);
        vault = new KudexVault(token, "Public test", "kTEST", address(0));
        registry.setVaultApproved(address(vault), true);
        executor = new KudexAgentExecutor(address(registry));
        token.mint(owner, 1000e6);
        vm.startPrank(owner);
        token.approve(address(executor), 300e6);
        id = executor.createPolicy(delegate, address(vault), uint64(block.timestamp + 3 days), 100e6, 150e6, 300e6);
        vm.stopPrank();
    }
    function test_DepositOnlySharesToOwnerAndNoResidualAllowance() public {
        vm.prank(delegate); executor.execute(id, 100e6);
        assertEq(token.balanceOf(owner), 900e6);
        assertEq(vault.balanceOf(owner), 100e6);
        assertEq(vault.balanceOf(delegate), 0);
        assertEq(token.balanceOf(address(executor)), 0);
        assertEq(token.allowance(address(executor), address(vault)), 0);
    }
    function test_DailyAndActionCaps() public {
        vm.startPrank(delegate);
        vm.expectRevert(KudexAgentExecutor.LimitExceeded.selector); executor.execute(id, 101e6);
        executor.execute(id, 100e6);
        vm.expectRevert(KudexAgentExecutor.LimitExceeded.selector); executor.execute(id, 51e6);
        executor.execute(id, 50e6);
        vm.stopPrank();
    }
    function test_UtcDayResetAndLifetimeCap() public {
        vm.prank(delegate); executor.execute(id, 100e6);
        vm.warp(block.timestamp + 1 days);
        vm.prank(delegate); executor.execute(id, 100e6);
        vm.warp(block.timestamp + 1 days);
        vm.prank(delegate); executor.execute(id, 100e6);
        vm.prank(delegate); vm.expectRevert(KudexAgentExecutor.LimitExceeded.selector); executor.execute(id, 1);
    }
    function test_UnauthorizedAndRevoked() public {
        vm.expectRevert(KudexAgentExecutor.Unauthorized.selector); executor.execute(id, 1e6);
        vm.expectRevert(KudexAgentExecutor.Unauthorized.selector); executor.revokePolicy(id);
        vm.prank(owner); executor.revokePolicy(id);
        vm.prank(delegate); vm.expectRevert(KudexAgentExecutor.InactivePolicy.selector); executor.execute(id, 1e6);
    }
    function test_ExpiryAndRegistryRemoval() public {
        registry.setVaultApproved(address(vault), false);
        vm.prank(delegate); vm.expectRevert(KudexAgentExecutor.VaultUnavailable.selector); executor.execute(id, 1e6);
        registry.setVaultApproved(address(vault), true);
        vm.warp(block.timestamp + 3 days);
        vm.prank(delegate); vm.expectRevert(KudexAgentExecutor.InactivePolicy.selector); executor.execute(id, 1e6);
    }
    function test_FailedDepositRollsBackBudget() public {
        vault.triggerDefault();
        vm.prank(delegate); vm.expectRevert(); executor.execute(id, 100e6);
        assertEq(token.balanceOf(owner), 1000e6);
        assertEq(token.allowance(owner, address(executor)), 300e6);
        // A failed execution must leave the original budget available.
        (,,,,,,,,,uint256 spent,,uint256 daySpent) = executor.policies(id);
        assertEq(spent, 0); assertEq(daySpent, 0);
    }
    function test_InvalidPolicyBounds() public {
        vm.startPrank(owner);
        vm.expectRevert(KudexAgentExecutor.InvalidPolicy.selector);
        executor.createPolicy(delegate, address(vault), uint64(block.timestamp + 31 days), 1, 2, 3);
        vm.expectRevert(KudexAgentExecutor.InvalidPolicy.selector);
        executor.createPolicy(delegate, address(vault), uint64(block.timestamp + 1 days), 2, 1, 3);
        vm.stopPrank();
    }
    function testFuzz_CannotExceedPerActionCap(uint128 amount) public {
        vm.assume(amount > 100e6);
        vm.prank(delegate); vm.expectRevert(KudexAgentExecutor.LimitExceeded.selector); executor.execute(id, amount);
    }
}
