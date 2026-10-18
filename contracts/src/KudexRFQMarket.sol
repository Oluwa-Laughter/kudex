// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract KudexRFQMarket is ReentrancyGuard, EIP712 {
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

    struct Balances {
        uint256 makerIn;
        uint256 takerIn;
        uint256 makerOut;
        uint256 takerOut;
    }

    bytes32 public constant ORDER_TYPEHASH = keccak256(
        "Order(address maker,address tokenIn,address tokenOut,uint256 amountIn,uint256 amountOut,uint256 deadline,uint256 nonce)"
    );

    constructor() EIP712("KudexRFQMarket", "1") {}

    mapping(address => mapping(uint256 => bool)) public orderCancelled;
    mapping(address => mapping(uint256 => bool)) public nonceUsed;
    mapping(bytes32 => bool) public orderSettled;

    event RFQSettled(bytes32 indexed orderHash, address indexed taker, address maker);
    event OrderCancelled(address indexed maker, uint256 indexed nonce);

    error OrderExpired();
    error OrderAlreadyProcessed();
    error OrderAlreadyCancelled();

    error InvalidOrder();
    error InvalidSignature();
    error InexactTokenTransfer();

    function hashOrder(Order memory order) public view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    ORDER_TYPEHASH,
                    order.maker,
                    order.tokenIn,
                    order.tokenOut,
                    order.amountIn,
                    order.amountOut,
                    order.deadline,
                    order.nonce
                )
            )
        );
    }

    function fillOrder(Order calldata order, bytes calldata signature) external nonReentrant {
        if (
            order.maker == address(0) || order.maker == msg.sender || order.tokenIn == order.tokenOut
                || order.tokenIn.code.length == 0 || order.tokenOut.code.length == 0 || order.amountIn == 0
                || order.amountOut == 0
        ) revert InvalidOrder();
        if (block.timestamp > order.deadline) revert OrderExpired();
        bytes32 orderHash = hashOrder(order);
        if (orderSettled[orderHash]) revert OrderAlreadyProcessed();
        if (orderCancelled[order.maker][order.nonce]) revert OrderAlreadyCancelled();

        if (nonceUsed[order.maker][order.nonce]) revert OrderAlreadyProcessed();
        if (!SignatureChecker.isValidSignatureNow(order.maker, orderHash, signature)) revert InvalidSignature();

        orderSettled[orderHash] = true;
        nonceUsed[order.maker][order.nonce] = true;

        Balances memory beforeTransfer = _balances(order, msg.sender);
        IERC20(order.tokenIn).safeTransferFrom(order.maker, msg.sender, order.amountIn);
        IERC20(order.tokenOut).safeTransferFrom(msg.sender, order.maker, order.amountOut);
        Balances memory afterTransfer = _balances(order, msg.sender);

        if (
            !_decreasedExactly(beforeTransfer.makerIn, afterTransfer.makerIn, order.amountIn)
                || !_increasedExactly(beforeTransfer.takerIn, afterTransfer.takerIn, order.amountIn)
                || !_decreasedExactly(beforeTransfer.takerOut, afterTransfer.takerOut, order.amountOut)
                || !_increasedExactly(beforeTransfer.makerOut, afterTransfer.makerOut, order.amountOut)
        ) revert InexactTokenTransfer();

        emit RFQSettled(orderHash, msg.sender, order.maker);
    }

    function cancelOrder(uint256 nonce) external {
        orderCancelled[msg.sender][nonce] = true;
        emit OrderCancelled(msg.sender, nonce);
    }

    function _balances(Order calldata order, address taker) private view returns (Balances memory) {
        return Balances(
            IERC20(order.tokenIn).balanceOf(order.maker),
            IERC20(order.tokenIn).balanceOf(taker),
            IERC20(order.tokenOut).balanceOf(order.maker),
            IERC20(order.tokenOut).balanceOf(taker)
        );
    }

    function _increasedExactly(uint256 beforeBalance, uint256 afterBalance, uint256 amount)
        private
        pure
        returns (bool)
    {
        return afterBalance >= beforeBalance && afterBalance - beforeBalance == amount;
    }

    function _decreasedExactly(uint256 beforeBalance, uint256 afterBalance, uint256 amount)
        private
        pure
        returns (bool)
    {
        return beforeBalance >= afterBalance && beforeBalance - afterBalance == amount;
    }
}
