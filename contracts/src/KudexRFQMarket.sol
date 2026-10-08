// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract KudexRFQMarket is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Order {
        address maker;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 deadline;
        uint256 nonce;
    }

    mapping(address => mapping(uint256 => bool)) public orderCancelled;
    mapping(bytes32 => bool) public orderSettled;

    event RFQSettled(bytes32 indexed orderHash, address indexed taker, address maker);
    event OrderCancelled(address indexed maker, uint256 indexed nonce);

    error OrderExpired();
    error OrderAlreadyProcessed();
    error OrderAlreadyCancelled();

    function hashOrder(Order memory order) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                order.maker,
                order.tokenIn,
                order.tokenOut,
                order.amountIn,
                order.amountOut,
                order.deadline,
                order.nonce
            )
        );
    }

    function fillOrder(
        Order calldata order,
        bytes calldata
    ) external nonReentrant {
        if (block.timestamp > order.deadline) revert OrderExpired();
        bytes32 orderHash = hashOrder(order);
        if (orderSettled[orderHash]) revert OrderAlreadyProcessed();
        if (orderCancelled[order.maker][order.nonce]) revert OrderAlreadyCancelled();

        orderSettled[orderHash] = true;

        IERC20(order.tokenIn).safeTransferFrom(order.maker, msg.sender, order.amountIn);
        IERC20(order.tokenOut).safeTransferFrom(msg.sender, order.maker, order.amountOut);

        emit RFQSettled(orderHash, msg.sender, order.maker);
    }

    function cancelOrder(uint256 nonce) external {
        orderCancelled[msg.sender][nonce] = true;
        emit OrderCancelled(msg.sender, nonce);
    }
}
