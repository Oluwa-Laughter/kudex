// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {KudexRFQMarket} from "./KudexRFQMarket.sol";

/// @notice Separate immutable RFQ-only delegation. Does not widen deposit executor rights.
/// @dev Exact-transfer reviewed tokens and a reviewed immutable router are required.
/// Token-unit price floor is NOT a USD cap or oracle; no arbitrary targets/recipients/calls.
contract KudexRfqExecutor is ReentrancyGuard {
    using SafeERC20 for IERC20;
    KudexRFQMarket public immutable router;
    uint256 public nextPolicy;
    uint256 public constant MAX_DURATION = 30 days;

    struct Terms {
        address delegate;
        address maker;
        address buyToken;
        address payToken;
        uint64 expiresAt;
        uint128 minimumBuy;
        uint128 referencePay;
        uint256 perActionCap;
        uint256 dailyCap;
        uint256 totalCap;
    }

    struct Policy {
        address owner;
        bool revoked;
        Terms terms;
        uint256 spent;
        uint256 day;
        uint256 daySpent;
    }
    mapping(bytes32 => Policy) private _policies;
    error InvalidPolicy();
    error Unauthorized();
    error Inactive();
    error OutsidePolicy();
    error InexactTransfer();
    event RfqPolicyCreated(bytes32 indexed id, address indexed owner, address indexed delegate);
    event RfqPolicyRevoked(bytes32 indexed id);
    event RfqExecuted(
        bytes32 indexed id, bytes32 indexed orderHash, address indexed owner, uint256 paid, uint256 received
    );

    constructor(KudexRFQMarket market) {
        if (address(market).code.length == 0) revert InvalidPolicy();
        router = market;
    }

    function policy(bytes32 id) external view returns (Policy memory) {
        return _policies[id];
    }

    function createPolicy(Terms calldata terms) external nonReentrant returns (bytes32 id) {
        if (
            terms.delegate == address(0) || terms.delegate == msg.sender || terms.maker == address(0)
                || terms.maker == msg.sender || terms.maker == address(this) || terms.buyToken == terms.payToken
                || terms.buyToken.code.length == 0 || terms.payToken.code.length == 0
                || terms.expiresAt <= block.timestamp || terms.expiresAt > block.timestamp + MAX_DURATION
                || terms.minimumBuy == 0 || terms.referencePay == 0 || terms.perActionCap == 0
                || terms.perActionCap > terms.dailyCap || terms.dailyCap > terms.totalCap
        ) revert InvalidPolicy();
        id = keccak256(abi.encode(block.chainid, address(this), msg.sender, nextPolicy++));
        _policies[id] = Policy(msg.sender, false, terms, 0, block.timestamp / 1 days, 0);
        emit RfqPolicyCreated(id, msg.sender, terms.delegate);
    }

    function revokePolicy(bytes32 id) external nonReentrant {
        Policy storage p = _policies[id];
        if (msg.sender != p.owner) revert Unauthorized();
        p.revoked = true;
        emit RfqPolicyRevoked(id);
    }

    function execute(bytes32 id, KudexRFQMarket.Order calldata order, bytes calldata signature) external nonReentrant {
        Policy storage p = _policies[id];
        Terms memory t = p.terms;
        if (msg.sender != t.delegate) revert Unauthorized();
        if (p.revoked || block.timestamp >= t.expiresAt) revert Inactive();
        if (
            order.maker != t.maker || order.tokenIn != t.buyToken || order.tokenOut != t.payToken || order.amountIn == 0
                || order.amountOut == 0 || order.amountOut > t.perActionCap || order.deadline > t.expiresAt
                || order.amountIn < Math.mulDiv(order.amountOut, t.minimumBuy, t.referencePay, Math.Rounding.Ceil)
        ) revert OutsidePolicy();
        uint256 day = block.timestamp / 1 days;
        if (p.day != day) {
            p.day = day;
            p.daySpent = 0;
        }
        if (order.amountOut > t.dailyCap - p.daySpent || order.amountOut > t.totalCap - p.spent) revert OutsidePolicy();
        p.spent += order.amountOut;
        p.daySpent += order.amountOut;
        _settle(p.owner, order, signature);
        emit RfqExecuted(id, router.hashOrder(order), p.owner, order.amountOut, order.amountIn);
    }

    function _settle(address owner, KudexRFQMarket.Order calldata order, bytes calldata signature) private {
        IERC20 pay = IERC20(order.tokenOut);
        IERC20 buy = IERC20(order.tokenIn);
        uint256 cash = pay.balanceOf(address(this));
        uint256 inventory = buy.balanceOf(address(this));
        uint256 ownerCash = pay.balanceOf(owner);
        uint256 ownerBought = buy.balanceOf(owner);
        pay.safeTransferFrom(owner, address(this), order.amountOut);
        if (
            pay.balanceOf(address(this)) != cash + order.amountOut
                || pay.balanceOf(owner) != ownerCash - order.amountOut
        ) {
            revert InexactTransfer();
        }
        pay.forceApprove(address(router), order.amountOut);
        router.fillOrder(order, signature);
        pay.forceApprove(address(router), 0);
        if (pay.balanceOf(address(this)) != cash || buy.balanceOf(address(this)) != inventory + order.amountIn) {
            revert InexactTransfer();
        }
        buy.safeTransfer(owner, order.amountIn);
        if (buy.balanceOf(address(this)) != inventory || buy.balanceOf(owner) != ownerBought + order.amountIn) {
            revert InexactTransfer();
        }
    }
}
