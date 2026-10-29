// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {KudexRfqExecutor} from "../src/KudexRfqExecutor.sol";
import {KudexRFQMarket} from "../src/KudexRFQMarket.sol";
import {KudexTestCreditFacility as Facility} from "../src/KudexTestCreditFacility.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract RfqHandler is Test {
    KudexRfqExecutor public executor;
    KudexRFQMarket public router;
    MockERC20 public buy;
    MockERC20 public pay;
    bytes32 public id;
    uint256 public paid;
    uint256 public received;
    uint256 nonce;
    address public maker;
    uint256 constant KEY = 0xA11CE;

    constructor() {
        maker = vm.addr(KEY);
        router = new KudexRFQMarket();
        executor = new KudexRfqExecutor(router);
        buy = new MockERC20("Buy", "B", 6);
        pay = new MockERC20("Pay", "P", 6);
        buy.mint(maker, 1000000);
        pay.mint(address(this), 1000000);
        vm.prank(maker);
        buy.approve(address(router), type(uint256).max);
        pay.approve(address(executor), type(uint256).max);
        id = executor.createPolicy(
            KudexRfqExecutor.Terms(
                address(0xD),
                maker,
                address(buy),
                address(pay),
                uint64(block.timestamp + 30 days),
                2,
                1,
                100,
                1000,
                1000
            )
        );
    }

    function trade(uint256 seed) external {
        uint256 remaining = 1000 - paid;
        if (remaining == 0) return;
        uint256 n = bound(seed, 1, remaining > 100 ? 100 : remaining);
        KudexRFQMarket.Order memory q =
            KudexRFQMarket.Order(maker, address(buy), address(pay), n * 2, n, block.timestamp + 1 hours, nonce++);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(KEY, router.hashOrder(q));
        vm.prank(address(0xD));
        executor.execute(id, q, abi.encodePacked(r, s, v));
        paid += n;
        received += n * 2;
    }
}

contract RfqAuthorityInvariantTest is StdInvariant, Test {
    RfqHandler h;

    function setUp() public {
        h = new RfqHandler();
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = h.trade.selector;
        targetSelector(FuzzSelector(address(h), selectors));
        targetContract(address(h));
    }

    function invariant_BudgetAndCustodyConservation() public view {
        KudexRfqExecutor e = h.executor();
        assertEq(e.policy(h.id()).spent, h.paid());
        assertLe(h.paid(), 1000);
        assertEq(h.received(), h.paid() * 2);
        assertEq(h.pay().balanceOf(address(h)) + h.pay().balanceOf(h.maker()), 1000000);
        assertEq(h.buy().balanceOf(address(h)) + h.buy().balanceOf(h.maker()), 1000000);
        assertEq(h.pay().balanceOf(address(e)), 0);
        assertEq(h.buy().balanceOf(address(e)), 0);
        assertEq(h.pay().allowance(address(e), address(h.router())), 0);
    }
}

contract CreditHandler is Test {
    Facility public facility;
    MockERC20 public token;

    constructor() {
        vm.chainId(420420777);
        token = new MockERC20("Test", "T", 6);
        facility = new Facility(
            token,
            address(this),
            address(this),
            keccak256("test"),
            600,
            400,
            uint64(block.timestamp + 1 days),
            uint64(block.timestamp + 2 days),
            0
        );
        token.mint(address(this), 1000);
        facility.setEligibility(address(this), true);
        token.approve(address(facility), type(uint256).max);
        facility.subscribe(true, 600);
        facility.subscribe(false, 400);
        facility.disburse();
    }

    function repay(uint256 seed) external {
        uint256 left = 1000 - facility.repaid();
        if (left > 0) facility.repay(bound(seed, 1, left));
    }

    function claim(bool senior) external {
        if (facility.claimable(address(this), senior) > 0) facility.claim(senior);
    }
}

contract CreditCashInvariantTest is StdInvariant, Test {
    CreditHandler h;

    function setUp() public {
        h = new CreditHandler();
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = h.repay.selector;
        selectors[1] = h.claim.selector;
        targetSelector(FuzzSelector(address(h), selectors));
        targetContract(address(h));
    }

    function invariant_RepaymentAndClaimsAreBacked() public view {
        Facility f = h.facility();
        assertLe(f.totalClaimed(), f.repaid());
        assertLe(f.repaid(), 1000);
        assertEq(h.token().balanceOf(address(f)) + f.totalClaimed(), f.repaid());
        assertLe(f.claimable(address(h), true) + f.claimable(address(h), false), h.token().balanceOf(address(f)));
    }
}
