// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {KudexVault} from "./KudexVault.sol";
import {KudexDaaSAdapter} from "./KudexDaaSAdapter.sol";

contract KudexRFQMarket is Ownable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant DEFAULT_PROTOCOL_FEE_BPS = 10; // 0.10% default settlement fee
    uint256 public constant MAX_PROTOCOL_FEE_BPS = 100; // 1.00% maximum cap
    uint256 public constant VAULT_FEE_SHARE_BPS = 8_000; // 80% to KudexVault depositors, 20% to Protection Reserve

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
        uint256 routerIn;
        uint256 routerOut;
    }

    struct FeePlan {
        uint256 feeOnIn;
        uint256 feeOnOut;
        uint256 takerExpectedIn;
        uint256 makerExpectedOut;
    }

    bytes32 public constant ORDER_TYPEHASH = keccak256(
        "Order(address maker,address tokenIn,address tokenOut,uint256 amountIn,uint256 amountOut,uint256 deadline,uint256 nonce)"
    );

    uint256 public protocolFeeBps = DEFAULT_PROTOCOL_FEE_BPS;
    address public yieldVault;
    address public protectionReserve;
    uint256 public totalVaultYieldRouted;
    uint256 public totalProtectionReserveRouted;

    mapping(address => mapping(uint256 => bool)) public orderCancelled;
    mapping(address => mapping(uint256 => bool)) public nonceUsed;
    mapping(bytes32 => bool) public orderSettled;

    event RFQSettled(bytes32 indexed orderHash, address indexed taker, address maker);
    event OrderCancelled(address indexed maker, uint256 indexed nonce);
    event FeeRoutingUpdated(address indexed yieldVault, address indexed protectionReserve, uint256 protocolFeeBps);
    event ProtocolFeeRouted(
        bytes32 indexed orderHash,
        address indexed feeToken,
        uint256 totalFee,
        uint256 vaultShare,
        uint256 protectionReserveShare
    );

    error OrderExpired();
    error OrderAlreadyProcessed();
    error OrderAlreadyCancelled();
    error InvalidOrder();
    error InvalidSignature();
    error InexactTokenTransfer();
    error InvalidFeeConfiguration();

    constructor() Ownable(msg.sender) EIP712("KudexRFQMarket", "1") {}

    function setFeeRouting(address _yieldVault, address _protectionReserve) external onlyOwner {
        if ((_yieldVault == address(0)) != (_protectionReserve == address(0))) {
            revert InvalidFeeConfiguration();
        }
        if (_yieldVault != address(0) && (_yieldVault.code.length == 0 || _protectionReserve.code.length == 0)) {
            revert InvalidFeeConfiguration();
        }
        yieldVault = _yieldVault;
        protectionReserve = _protectionReserve;
        emit FeeRoutingUpdated(_yieldVault, _protectionReserve, protocolFeeBps);
    }

    function setProtocolFeeBps(uint256 _protocolFeeBps) external onlyOwner {
        if (_protocolFeeBps > MAX_PROTOCOL_FEE_BPS) revert InvalidFeeConfiguration();
        protocolFeeBps = _protocolFeeBps;
        emit FeeRoutingUpdated(yieldVault, protectionReserve, _protocolFeeBps);
    }

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
        if (
            yieldVault != address(0)
                && (
                    msg.sender == yieldVault || msg.sender == protectionReserve || order.maker == yieldVault
                        || order.maker == protectionReserve
                )
        ) revert InvalidOrder();
        if (block.timestamp > order.deadline) revert OrderExpired();
        bytes32 orderHash = hashOrder(order);
        if (orderSettled[orderHash]) revert OrderAlreadyProcessed();
        if (orderCancelled[order.maker][order.nonce]) revert OrderAlreadyCancelled();
        if (nonceUsed[order.maker][order.nonce]) revert OrderAlreadyProcessed();
        if (!SignatureChecker.isValidSignatureNow(order.maker, orderHash, signature)) revert InvalidSignature();

        orderSettled[orderHash] = true;
        nonceUsed[order.maker][order.nonce] = true;

        _executeOrderTransfers(order, orderHash);

        emit RFQSettled(orderHash, msg.sender, order.maker);
    }

    function _computeFeePlan(Order calldata order) private view returns (FeePlan memory plan) {
        uint256 feeOnIn = 0;
        uint256 feeOnOut = 0;
        if (yieldVault != address(0) && protocolFeeBps > 0 && !KudexVault(yieldVault).isDefaulted()) {
            address vaultAsset = KudexVault(yieldVault).asset();
            if (order.tokenOut == vaultAsset) {
                feeOnOut = (order.amountOut * protocolFeeBps) / BPS_DENOMINATOR;
            } else if (order.tokenIn == vaultAsset) {
                feeOnIn = (order.amountIn * protocolFeeBps) / BPS_DENOMINATOR;
            }
        }
        plan = FeePlan({
            feeOnIn: feeOnIn,
            feeOnOut: feeOnOut,
            takerExpectedIn: order.amountIn - feeOnIn,
            makerExpectedOut: order.amountOut - feeOnOut
        });
    }

    function _executeOrderTransfers(Order calldata order, bytes32 orderHash) private {
        FeePlan memory plan = _computeFeePlan(order);
        Balances memory beforeTransfer = _balances(order, msg.sender);

        IERC20(order.tokenIn).safeTransferFrom(order.maker, msg.sender, plan.takerExpectedIn);
        if (plan.feeOnIn > 0) {
            IERC20(order.tokenIn).safeTransferFrom(order.maker, address(this), plan.feeOnIn);
            _routeCollectedFee(orderHash, order.tokenIn, plan.feeOnIn);
        }

        IERC20(order.tokenOut).safeTransferFrom(msg.sender, order.maker, plan.makerExpectedOut);
        if (plan.feeOnOut > 0) {
            IERC20(order.tokenOut).safeTransferFrom(msg.sender, address(this), plan.feeOnOut);
            _routeCollectedFee(orderHash, order.tokenOut, plan.feeOnOut);
        }

        Balances memory afterTransfer = _balances(order, msg.sender);
        if (
            !_decreasedExactly(beforeTransfer.makerIn, afterTransfer.makerIn, order.amountIn)
                || !_increasedExactly(beforeTransfer.takerIn, afterTransfer.takerIn, plan.takerExpectedIn)
                || !_decreasedExactly(beforeTransfer.takerOut, afterTransfer.takerOut, order.amountOut)
                || !_increasedExactly(beforeTransfer.makerOut, afterTransfer.makerOut, plan.makerExpectedOut)
                || afterTransfer.routerIn != beforeTransfer.routerIn
                || afterTransfer.routerOut != beforeTransfer.routerOut
        ) revert InexactTokenTransfer();
    }

    function _routeCollectedFee(bytes32 orderHash, address feeToken, uint256 totalFee) private {
        uint256 vaultShare = (totalFee * VAULT_FEE_SHARE_BPS) / BPS_DENOMINATOR;
        uint256 reserveShare = totalFee - vaultShare;

        if (vaultShare > 0) {
            IERC20(feeToken).forceApprove(yieldVault, vaultShare);
            KudexVault(yieldVault).distributeYield(vaultShare);
            IERC20(feeToken).forceApprove(yieldVault, 0);
            totalVaultYieldRouted += vaultShare;
        }
        if (reserveShare > 0) {
            IERC20(feeToken).forceApprove(protectionReserve, reserveShare);
            KudexDaaSAdapter(protectionReserve).fundReserve(feeToken, reserveShare);
            IERC20(feeToken).forceApprove(protectionReserve, 0);
            totalProtectionReserveRouted += reserveShare;
        }

        emit ProtocolFeeRouted(orderHash, feeToken, totalFee, vaultShare, reserveShare);
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
            IERC20(order.tokenOut).balanceOf(taker),
            IERC20(order.tokenIn).balanceOf(address(this)),
            IERC20(order.tokenOut).balanceOf(address(this))
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
