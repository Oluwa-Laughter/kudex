// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {KudexTestCreditFacility as Facility} from "../src/KudexTestCreditFacility.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract KudexTestCreditFacilityTest is Test {
    Facility f;
    MockERC20 token;
    address senior = address(0x1);
    address junior = address(0x2);
    address borrower = address(0x3);

    function setUp() public {
        vm.chainId(420420777);
        vm.warp(1000);
        token = new MockERC20("Test", "KTEST", 6);
        f = new Facility(token, address(this), borrower, keccak256("unbacked test fixture"), 600, 400, 2000, 3000, 100);
        for (uint256 i = 1; i <= 3; i++) {
            address a = address(uint160(i));
            token.mint(a, 1000);
            f.setEligibility(a, true);
            vm.prank(a);
            token.approve(address(f), 1000);
        }
    }

    function fund() internal {
        vm.prank(senior);
        f.subscribe(true, 600);
        vm.prank(junior);
        f.subscribe(false, 400);
        vm.prank(borrower);
        f.disburse();
    }

    function test_LifecycleSeniorFirstAndRecovery() public {
        fund();
        vm.prank(borrower);
        f.repay(500);
        assertEq(f.claimable(senior, true), 500);
        assertEq(f.claimable(junior, false), 0);
        vm.prank(senior);
        f.claim(true);
        vm.warp(3100);
        f.declareDefault();
        assertEq(uint256(f.state()), 2);
        vm.prank(borrower);
        f.repay(500);
        assertEq(uint256(f.state()), 3);
        vm.prank(senior);
        f.claim(true);
        vm.prank(junior);
        f.claim(false);
        assertEq(f.totalClaimed(), 1000);
        assertEq(token.balanceOf(address(f)), 0);
        vm.prank(junior);
        vm.expectRevert(Facility.InvalidAmount.selector);
        f.claim(false);
    }

    function test_FailedRaiseRefundAndNoLateDisbursement() public {
        vm.prank(senior);
        f.subscribe(true, 200);
        vm.warp(2000);
        vm.prank(borrower);
        vm.expectRevert(Facility.InvalidState.selector);
        f.disburse();
        vm.prank(senior);
        f.refund(true);
        assertEq(token.balanceOf(senior), 1000);
        assertEq(f.totalRefunded(), 200);
        vm.prank(senior);
        vm.expectRevert(Facility.InvalidAmount.selector);
        f.refund(true);
    }

    function test_AuthorizationOverpaymentAndDefaultBoundary() public {
        vm.prank(senior);
        vm.expectRevert(Facility.Unauthorized.selector);
        f.setEligibility(junior, true);
        vm.prank(address(77));
        vm.expectRevert(Facility.Unauthorized.selector);
        f.subscribe(true, 1);
        fund();
        vm.expectRevert(Facility.InvalidState.selector);
        f.declareDefault();
        vm.prank(borrower);
        vm.expectRevert(Facility.InvalidAmount.selector);
        f.repay(1001);
    }

    function testFuzz_WaterfallConservesMeasuredCash(uint96 amount) public {
        fund();
        uint256 n = bound(amount, 1, 1000);
        vm.prank(borrower);
        f.repay(n);
        uint256 s = f.claimable(senior, true);
        uint256 j = f.claimable(junior, false);
        assertEq(s + j, n);
        assertLe(j, 400);
        assertLe(s, 600);
        assertEq(token.balanceOf(address(f)), n);
        if (s > 0) {
            vm.prank(senior);
            f.claim(true);
        }
        if (j > 0) {
            vm.prank(junior);
            f.claim(false);
        }
        assertEq(f.totalClaimed() + token.balanceOf(address(f)), f.repaid());
    }

    function test_RevokedEligibilityCannotSeizeRepaymentClaims() public {
        fund();
        f.setEligibility(senior, false);
        vm.prank(borrower);
        f.repay(600);
        vm.prank(senior);
        f.claim(true);
        assertEq(f.totalClaimed(), 600);
    }

    function test_MultipleInvestorsHaveCumulativeRoundingAndNoOverclaim() public {
        vm.prank(senior);
        f.subscribe(true, 200);
        vm.prank(junior);
        f.subscribe(true, 400);
        vm.prank(junior);
        f.subscribe(false, 400);
        vm.prank(borrower);
        f.disburse();
        vm.prank(borrower);
        f.repay(1);
        assertEq(f.claimable(senior, true), 0);
        assertEq(f.claimable(junior, true), 0);
        assertEq(token.balanceOf(address(f)), 1);
        vm.prank(borrower);
        f.repay(999);
        vm.prank(senior);
        f.claim(true);
        vm.prank(junior);
        f.claim(true);
        vm.prank(junior);
        f.claim(false);
        assertEq(f.totalClaimed(), 1000);
        assertEq(token.balanceOf(address(f)), 0);
    }
}
