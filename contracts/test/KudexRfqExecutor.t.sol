// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {KudexRfqExecutor} from "../src/KudexRfqExecutor.sol";
import {KudexRFQMarket} from "../src/KudexRFQMarket.sol";
import {TransferTaxToken} from "./KudexRFQMarket.t.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract KudexRfqExecutorTest is Test {
    KudexRfqExecutor e;
    KudexRFQMarket r;
    MockERC20 buy;
    MockERC20 pay;
    address owner = address(0xB);
    address delegate = address(0xD);
    uint256 key = 0xA11CE;
    address maker;
    bytes32 id;

    function setUp() public {
        vm.warp(10 days);
        maker = vm.addr(key);
        r = new KudexRFQMarket();
        e = new KudexRfqExecutor(r);
        buy = new MockERC20("Buy", "B", 6);
        pay = new MockERC20("Pay", "P", 6);
        buy.mint(maker, 1000000);
        pay.mint(owner, 1000000);
        vm.prank(maker);
        buy.approve(address(r), type(uint256).max);
        vm.prank(owner);
        pay.approve(address(e), type(uint256).max);
        id = create(100, 150, 300);
    }

    function create(uint256 action, uint256 daily, uint256 total) internal returns (bytes32) {
        vm.prank(owner);
        return e.createPolicy(
            KudexRfqExecutor.Terms(
                delegate,
                maker,
                address(buy),
                address(pay),
                uint64(block.timestamp + 7 days),
                2,
                1,
                action,
                daily,
                total
            )
        );
    }

    function quote(uint256 nonce, uint256 paid, uint256 received) internal view returns (KudexRFQMarket.Order memory) {
        return KudexRFQMarket.Order(maker, address(buy), address(pay), received, paid, block.timestamp + 1 hours, nonce);
    }

    function fill(KudexRFQMarket.Order memory q) internal {
        (uint8 v, bytes32 rr, bytes32 s) = vm.sign(key, r.hashOrder(q));
        vm.prank(delegate);
        e.execute(id, q, abi.encodePacked(rr, s, v));
    }

    function reject(KudexRFQMarket.Order memory q, bytes4 reason) internal {
        (uint8 v, bytes32 rr, bytes32 ss) = vm.sign(key, r.hashOrder(q));
        vm.prank(delegate);
        vm.expectRevert(reason);
        e.execute(id, q, abi.encodePacked(rr, ss, v));
    }

    function test_ExactTradeNoCustodyOrResidualApproval() public {
        fill(quote(1, 50, 100));
        assertEq(pay.balanceOf(owner), 999950);
        assertEq(buy.balanceOf(owner), 100);
        assertEq(pay.balanceOf(address(e)), 0);
        assertEq(buy.balanceOf(address(e)), 0);
        assertEq(pay.allowance(address(e), address(r)), 0);
        assertEq(e.policy(id).spent, 50);
    }

    function test_UnauthorizedAndRevoked() public {
        KudexRFQMarket.Order memory q = quote(1, 50, 100);
        vm.expectRevert(KudexRfqExecutor.Unauthorized.selector);
        e.execute(id, q, "");
        vm.prank(owner);
        e.revokePolicy(id);
        reject(q, KudexRfqExecutor.Inactive.selector);
    }

    function test_DailyAndLifetimeCaps() public {
        fill(quote(1, 100, 200));
        reject(quote(2, 100, 200), KudexRfqExecutor.OutsidePolicy.selector);
        vm.warp(block.timestamp + 1 days);
        fill(quote(2, 100, 200));
        vm.warp(block.timestamp + 1 days);
        fill(quote(3, 100, 200));
        vm.warp(block.timestamp + 1 days);
        reject(quote(4, 1, 2), KudexRfqExecutor.OutsidePolicy.selector);
        assertEq(e.policy(id).spent, 300);
    }

    function test_FailedSignatureRollsBackBudgetAndFunds() public {
        KudexRFQMarket.Order memory q = quote(1, 50, 100);
        vm.prank(delegate);
        vm.expectRevert(KudexRFQMarket.InvalidSignature.selector);
        e.execute(id, q, hex"1234");
        assertEq(e.policy(id).spent, 0);
        assertEq(pay.balanceOf(owner), 1000000);
        assertEq(pay.allowance(address(e), address(r)), 0);
    }

    function test_PriceCounterpartyPairExpiryAndReplay() public {
        KudexRFQMarket.Order memory q = quote(1, 50, 99);
        reject(q, KudexRfqExecutor.OutsidePolicy.selector);
        q = quote(1, 50, 100);
        q.maker = address(0x123);
        reject(q, KudexRfqExecutor.OutsidePolicy.selector);
        q = quote(1, 50, 100);
        q.tokenOut = address(buy);
        reject(q, KudexRfqExecutor.OutsidePolicy.selector);
        q = quote(1, 50, 100);
        q.deadline = block.timestamp + 8 days;
        reject(q, KudexRfqExecutor.OutsidePolicy.selector);
        q = quote(1, 50, 100);
        fill(q);
        reject(q, KudexRFQMarket.OrderAlreadyProcessed.selector);
        assertEq(e.policy(id).spent, 50);
        vm.warp(block.timestamp + 7 days);
        reject(quote(2, 1, 2), KudexRfqExecutor.Inactive.selector);
    }

    function testFuzz_ExecutionConservesAssetsAndCaps(uint96 amount) public {
        uint256 n = bound(amount, 1, 100);
        fill(quote(1, n, 2 * n));
        assertEq(pay.balanceOf(owner) + pay.balanceOf(maker), 1000000);
        assertEq(buy.balanceOf(owner) + buy.balanceOf(maker), 1000000);
        assertEq(e.policy(id).spent, n);
        assertLe(e.policy(id).spent, 300);
    }

    function test_RationalFloorRoundsUpAndCancelledQuoteRollsBack() public {
        vm.prank(owner);
        id = e.createPolicy(
            KudexRfqExecutor.Terms(
                delegate, maker, address(buy), address(pay), uint64(block.timestamp + 1 days), 3, 2, 100, 150, 300
            )
        );
        reject(quote(1, 3, 4), KudexRfqExecutor.OutsidePolicy.selector);
        fill(quote(1, 3, 5));
        vm.prank(maker);
        r.cancelOrder(2);
        reject(quote(2, 3, 5), KudexRFQMarket.OrderAlreadyCancelled.selector);
        assertEq(e.policy(id).spent, 3);
    }

    function test_TaxedOwnerFundingRollsBackAuthorityAndCash() public {
        TransferTaxToken tax = new TransferTaxToken();
        tax.mint(owner, 1000);
        vm.startPrank(owner);
        tax.approve(address(e), 1000);
        id = e.createPolicy(
            KudexRfqExecutor.Terms(
                delegate, maker, address(buy), address(tax), uint64(block.timestamp + 1 days), 2, 1, 100, 150, 300
            )
        );
        vm.stopPrank();
        KudexRFQMarket.Order memory q = quote(1, 50, 100);
        q.tokenOut = address(tax);
        reject(q, KudexRfqExecutor.InexactTransfer.selector);
        assertEq(tax.balanceOf(owner), 1000);
        assertEq(e.policy(id).spent, 0);
        assertEq(tax.allowance(address(e), address(r)), 0);
    }

    function test_TaxedMakerLegRollsBackOwnerFunding() public {
        TransferTaxToken tax = new TransferTaxToken();
        tax.mint(maker, 1000);
        vm.prank(maker);
        tax.approve(address(r), 1000);
        vm.prank(owner);
        id = e.createPolicy(
            KudexRfqExecutor.Terms(
                delegate, maker, address(tax), address(pay), uint64(block.timestamp + 1 days), 2, 1, 100, 150, 300
            )
        );
        KudexRFQMarket.Order memory q = quote(1, 50, 100);
        q.tokenIn = address(tax);
        reject(q, KudexRFQMarket.InexactTokenTransfer.selector);
        assertEq(pay.balanceOf(owner), 1000000);
        assertEq(e.policy(id).spent, 0);
        assertEq(pay.allowance(address(e), address(r)), 0);
    }
}
