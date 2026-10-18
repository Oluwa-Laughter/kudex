// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import {Test} from "forge-std/Test.sol";
import {KudexRFQMarket} from "../src/KudexRFQMarket.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract ContractMaker is IERC1271 {
    bytes32 private approvedHash;

    function approveOrder(bytes32 hash, IERC20 token, address spender) external {
        approvedHash = hash;
        token.approve(spender, type(uint256).max);
    }

    function isValidSignature(bytes32 hash, bytes memory) external view returns (bytes4) {
        return hash == approvedHash ? IERC1271.isValidSignature.selector : bytes4(0xffffffff);
    }
}

contract TransferTaxToken is MockERC20 {
    constructor() MockERC20("Transfer tax fixture", "TAX", 6) {}

    function _update(address from, address to, uint256 amount) internal override {
        if (from != address(0) && to != address(0) && amount > 1) {
            super._update(from, to, amount - 1);
            super._update(from, address(0), 1);
        } else {
            super._update(from, to, amount);
        }
    }
}

contract KudexRFQMarketTest is Test {
    KudexRFQMarket public market;
    MockERC20 public tokenIn;
    MockERC20 public tokenOut;

    uint256 private constant MAKER_KEY = 0xA11CE;
    address public maker;
    address public taker = address(0x20);

    function setUp() public {
        maker = vm.addr(MAKER_KEY);
        market = new KudexRFQMarket();
        tokenIn = new MockERC20("Portaldot USD", "pUSD", 6);
        tokenOut = new MockERC20("Portaldot Wrapped POT", "wPOT", 14);

        tokenIn.mint(maker, 10_000 * 1e6);
        tokenOut.mint(taker, 10_000 * 1e14);

        vm.prank(maker);
        tokenIn.approve(address(market), type(uint256).max);

        vm.prank(taker);
        tokenOut.approve(address(market), type(uint256).max);
    }

    function test_FillOrder() public {
        KudexRFQMarket.Order memory order = KudexRFQMarket.Order({
            maker: maker,
            tokenIn: address(tokenIn),
            tokenOut: address(tokenOut),
            amountIn: 1_000 * 1e6,
            amountOut: 500 * 1e14,
            deadline: block.timestamp + 3600,
            nonce: 1
        });

        bytes memory signature = signOrder(order);
        bytes32 orderHash = market.hashOrder(order);
        assertFalse(market.orderSettled(orderHash));

        vm.prank(taker);
        market.fillOrder(order, signature);

        assertTrue(market.orderSettled(orderHash));
        assertEq(tokenIn.balanceOf(taker), 1_000 * 1e6);
        assertEq(tokenOut.balanceOf(maker), 500 * 1e14);

        // Cannot replay settled order
        vm.prank(taker);
        vm.expectRevert(KudexRFQMarket.OrderAlreadyProcessed.selector);
        market.fillOrder(order, signature);
    }

    function test_OrderExpired() public {
        KudexRFQMarket.Order memory order = KudexRFQMarket.Order({
            maker: maker,
            tokenIn: address(tokenIn),
            tokenOut: address(tokenOut),
            amountIn: 1_000 * 1e6,
            amountOut: 500 * 1e14,
            deadline: block.timestamp + 10,
            nonce: 2
        });

        bytes memory signature = signOrder(order);
        vm.warp(block.timestamp + 20);

        vm.prank(taker);
        vm.expectRevert(KudexRFQMarket.OrderExpired.selector);
        market.fillOrder(order, signature);
    }

    function test_CancelOrder() public {
        uint256 nonce = 5;
        vm.prank(maker);
        market.cancelOrder(nonce);

        assertTrue(market.orderCancelled(maker, nonce));

        KudexRFQMarket.Order memory order = KudexRFQMarket.Order({
            maker: maker,
            tokenIn: address(tokenIn),
            tokenOut: address(tokenOut),
            amountIn: 100 * 1e6,
            amountOut: 50 * 1e14,
            deadline: block.timestamp + 3600,
            nonce: nonce
        });

        bytes memory signature = signOrder(order);
        vm.prank(taker);
        vm.expectRevert(KudexRFQMarket.OrderAlreadyCancelled.selector);
        market.fillOrder(order, signature);
    }

    function signOrder(KudexRFQMarket.Order memory order) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(MAKER_KEY, market.hashOrder(order));
        return abi.encodePacked(r, s, v);
    }

    function exampleOrder() internal view returns (KudexRFQMarket.Order memory) {
        return
            KudexRFQMarket.Order(maker, address(tokenIn), address(tokenOut), 100e6, 50e14, block.timestamp + 1 hours, 9);
    }

    function test_UnsignedOrderCannotDrainMaker() public {
        KudexRFQMarket.Order memory order = exampleOrder();
        vm.prank(taker);
        vm.expectRevert(KudexRFQMarket.InvalidSignature.selector);
        market.fillOrder(order, "");
        assertEq(tokenIn.balanceOf(maker), 10_000e6);
    }

    function test_TamperedAmountRejected() public {
        KudexRFQMarket.Order memory order = exampleOrder();
        bytes memory signature = signOrder(order);
        order.amountOut = 1;
        vm.prank(taker);
        vm.expectRevert(KudexRFQMarket.InvalidSignature.selector);
        market.fillOrder(order, signature);
    }

    function test_SignatureCannotReplayOnAnotherDeployment() public {
        KudexRFQMarket.Order memory order = exampleOrder();
        bytes memory signature = signOrder(order);
        KudexRFQMarket other = new KudexRFQMarket();
        vm.prank(taker);
        vm.expectRevert(KudexRFQMarket.InvalidSignature.selector);
        other.fillOrder(order, signature);
    }

    function test_SignatureCannotReplayOnAnotherChain() public {
        KudexRFQMarket.Order memory order = exampleOrder();
        bytes memory signature = signOrder(order);
        vm.chainId(block.chainid + 1);
        vm.prank(taker);
        vm.expectRevert(KudexRFQMarket.InvalidSignature.selector);
        market.fillOrder(order, signature);
    }

    function test_NonceCanOnlySettleOnce() public {
        KudexRFQMarket.Order memory order = exampleOrder();
        bytes memory signature = signOrder(order);
        vm.prank(taker);
        market.fillOrder(order, signature);
        order.amountIn += 1;
        signature = signOrder(order);
        vm.prank(taker);
        vm.expectRevert(KudexRFQMarket.OrderAlreadyProcessed.selector);
        market.fillOrder(order, signature);
    }

    function testFuzz_ChangedAmountRejected(uint256 amount) public {
        vm.assume(amount > 0 && amount != 100e6);
        KudexRFQMarket.Order memory order = exampleOrder();
        bytes memory signature = signOrder(order);
        order.amountIn = amount;
        vm.prank(taker);
        vm.expectRevert(KudexRFQMarket.InvalidSignature.selector);
        market.fillOrder(order, signature);
    }

    function test_ContractWalletMakerCanAuthorizeOrder() public {
        ContractMaker wallet = new ContractMaker();
        KudexRFQMarket.Order memory order = exampleOrder();
        order.maker = address(wallet);
        tokenIn.mint(address(wallet), order.amountIn);
        wallet.approveOrder(market.hashOrder(order), tokenIn, address(market));
        vm.prank(taker);
        market.fillOrder(order, "");
        assertEq(tokenOut.balanceOf(address(wallet)), order.amountOut);
    }

    function test_FailedSecondLegRollsBackFirstTransferAndNonce() public {
        KudexRFQMarket.Order memory order = exampleOrder();
        bytes memory signature = signOrder(order);
        vm.prank(taker);
        tokenOut.approve(address(market), 0);
        uint256 originalBalance = tokenIn.balanceOf(maker);
        vm.prank(taker);
        vm.expectRevert();
        market.fillOrder(order, signature);
        assertEq(tokenIn.balanceOf(maker), originalBalance);
        assertFalse(market.nonceUsed(maker, order.nonce));
        assertFalse(market.orderSettled(market.hashOrder(order)));
    }

    function test_ZeroAmountOrderRejected() public {
        KudexRFQMarket.Order memory order = exampleOrder();
        order.amountOut = 0;
        vm.prank(taker);
        vm.expectRevert(KudexRFQMarket.InvalidOrder.selector);
        market.fillOrder(order, "");
    }

    function test_TransferTaxOnMakerLegRollsBackBothLegsAndNonce() public {
        _assertTaxedLegRejected(true);
    }

    function test_TransferTaxOnTakerLegRollsBackBothLegsAndNonce() public {
        _assertTaxedLegRejected(false);
    }

    function _assertTaxedLegRejected(bool makerLeg) private {
        TransferTaxToken taxed = new TransferTaxToken();
        KudexRFQMarket.Order memory order = exampleOrder();
        address payer = makerLeg ? maker : taker;
        uint256 amount = makerLeg ? order.amountIn : order.amountOut;
        taxed.mint(payer, amount);
        vm.prank(payer);
        taxed.approve(address(market), amount);
        if (makerLeg) order.tokenIn = address(taxed);
        else order.tokenOut = address(taxed);
        bytes memory signature = signOrder(order);
        uint256 originalIn = IERC20(order.tokenIn).balanceOf(maker);
        uint256 originalOut = IERC20(order.tokenOut).balanceOf(taker);
        vm.prank(taker);
        vm.expectRevert(KudexRFQMarket.InexactTokenTransfer.selector);
        market.fillOrder(order, signature);
        assertEq(IERC20(order.tokenIn).balanceOf(maker), originalIn);
        assertEq(IERC20(order.tokenOut).balanceOf(taker), originalOut);
        assertEq(IERC20(order.tokenIn).balanceOf(taker), 0);
        assertEq(IERC20(order.tokenOut).balanceOf(maker), 0);
        assertFalse(market.nonceUsed(maker, order.nonce));
        assertFalse(market.orderSettled(market.hashOrder(order)));
    }

    function test_MakerCannotConsumeNonceThroughSelfFill() public {
        KudexRFQMarket.Order memory order = exampleOrder();
        bytes memory signature = signOrder(order);
        vm.prank(maker);
        vm.expectRevert(KudexRFQMarket.InvalidOrder.selector);
        market.fillOrder(order, signature);
        assertFalse(market.nonceUsed(maker, order.nonce));
    }
}
