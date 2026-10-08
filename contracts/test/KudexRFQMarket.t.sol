// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {KudexRFQMarket} from "../src/KudexRFQMarket.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract KudexRFQMarketTest is Test {
    KudexRFQMarket public market;
    MockERC20 public tokenIn;
    MockERC20 public tokenOut;

    address public maker = address(0x10);
    address public taker = address(0x20);

    function setUp() public {
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

        bytes32 orderHash = market.hashOrder(order);
        assertFalse(market.orderSettled(orderHash));

        vm.prank(taker);
        market.fillOrder(order, "");

        assertTrue(market.orderSettled(orderHash));
        assertEq(tokenIn.balanceOf(taker), 1_000 * 1e6);
        assertEq(tokenOut.balanceOf(maker), 500 * 1e14);

        // Cannot replay settled order
        vm.prank(taker);
        vm.expectRevert(KudexRFQMarket.OrderAlreadyProcessed.selector);
        market.fillOrder(order, "");
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

        vm.warp(block.timestamp + 20);

        vm.prank(taker);
        vm.expectRevert(KudexRFQMarket.OrderExpired.selector);
        market.fillOrder(order, "");
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

        vm.prank(taker);
        vm.expectRevert(KudexRFQMarket.OrderAlreadyCancelled.selector);
        market.fillOrder(order, "");
    }
}
