// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {KudexVault} from "./KudexVault.sol";
import {KudexDaaSAdapter} from "./KudexDaaSAdapter.sol";
import {IKudexPOTStaking} from "./KudexPOTStaking.sol";

/**
 * @title KudexInvoiceEscrow
 * @notice On-Chain Business Invoice Escrow with Multi-Approver Team Sign-Off, Confidential Vault Settlement, and POT 0-bps Fee Waiver.
 */
contract KudexInvoiceEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant DEFAULT_INVOICE_FEE_BPS = 10; // 0.10% default settlement fee
    uint256 public constant MAX_INVOICE_FEE_BPS = 100; // 1.00% maximum cap
    uint256 public constant MAX_APPROVERS = 10;

    enum InvoiceStatus {
        Pending,
        Approved,
        Settled,
        Cancelled
    }

    struct Invoice {
        bytes32 invoiceId;
        address issuer;
        address payer;
        address token;
        uint256 amount;
        uint256 dueTimestamp;
        bytes32 encryptedReference;
        address[] requiredApprovers;
        uint256 approvalCount;
        InvoiceStatus status;
    }

    uint256 public protocolFeeBps = DEFAULT_INVOICE_FEE_BPS;
    uint256 public potStakerFeeShareBps = 1_000; // 10% of collected fees to POT stakers
    uint256 public vaultFeeShareBps = 7_000; // 70% to Vault depositors, remaining 20% to Protection Reserve

    address public yieldVault;
    address public protectionReserve;
    address public potStaking;

    mapping(bytes32 => Invoice) private _invoices;
    mapping(bytes32 => mapping(address => bool)) public isRequiredApprover;
    mapping(bytes32 => mapping(address => bool)) public hasApproved;
    mapping(address => uint256) public issuerNonces;
    mapping(address => bytes32[]) private _accountInvoices;
    mapping(address => mapping(bytes32 => bool)) private _accountInvoiceIndexed;
    bytes32[] public allInvoiceIds;

    event InvoiceCreated(
        bytes32 indexed invoiceId,
        address indexed issuer,
        address indexed payer,
        address token,
        uint256 amount,
        uint256 dueTimestamp,
        bytes32 encryptedReference,
        uint256 requiredApprovals,
        uint256 timestamp
    );

    event InvoiceApproved(
        bytes32 indexed invoiceId,
        address indexed approver,
        uint256 approvalCount,
        uint256 requiredApprovals,
        bool fullyApproved,
        uint256 timestamp
    );

    event InvoiceSettled(
        bytes32 indexed invoiceId,
        address indexed payer,
        address indexed issuer,
        address token,
        uint256 amount,
        uint256 protocolFee,
        bool confidentialSettlement,
        bytes32 commitment,
        uint256 timestamp
    );

    event InvoiceCancelled(bytes32 indexed invoiceId, address indexed issuer, uint256 timestamp);

    event EscrowConfigurationUpdated(
        address indexed yieldVault,
        address indexed protectionReserve,
        address indexed potStaking,
        uint256 protocolFeeBps
    );

    error InvalidInvoiceParameters();
    error InvoiceAlreadyExists();
    error InvoiceNotFound();
    error InvoiceNotPayable();
    error ApprovalsIncomplete();
    error UnauthorizedApprover();
    error AlreadyApproved();
    error UnauthorizedPayer();
    error UnauthorizedIssuer();
    error InexactTokenTransfer();
    error ConfidentialVaultUnavailable();

    constructor(address _yieldVault, address _protectionReserve, address _potStaking) Ownable(msg.sender) {
        yieldVault = _yieldVault;
        protectionReserve = _protectionReserve;
        potStaking = _potStaking;
    }

    function setProtocolIntegrations(
        address _yieldVault,
        address _protectionReserve,
        address _potStaking,
        uint256 _protocolFeeBps
    ) external onlyOwner {
        if (_protocolFeeBps > MAX_INVOICE_FEE_BPS) revert InvalidInvoiceParameters();
        yieldVault = _yieldVault;
        protectionReserve = _protectionReserve;
        potStaking = _potStaking;
        protocolFeeBps = _protocolFeeBps;
        emit EscrowConfigurationUpdated(_yieldVault, _protectionReserve, _potStaking, _protocolFeeBps);
    }

    /// @notice Create a new on-chain invoice with optional multi-approver team sign-off requirements.
    function createInvoice(
        bytes32 invoiceId,
        address payer,
        address token,
        uint256 amount,
        uint256 dueTimestamp,
        bytes32 encryptedReference,
        address[] calldata requiredApprovers
    ) external returns (bytes32 resolvedId) {
        if (
            token == address(0) || token.code.length == 0 || amount == 0 || dueTimestamp == 0
                || requiredApprovers.length > MAX_APPROVERS
        ) {
            revert InvalidInvoiceParameters();
        }

        uint256 nonce = issuerNonces[msg.sender]++;
        resolvedId = invoiceId == bytes32(0)
            ? keccak256(
                abi.encode(
                    msg.sender,
                    payer,
                    token,
                    amount,
                    dueTimestamp,
                    encryptedReference,
                    nonce,
                    block.chainid
                )
            )
            : invoiceId;

        if (_invoices[resolvedId].issuer != address(0)) revert InvoiceAlreadyExists();

        Invoice storage inv = _invoices[resolvedId];
        inv.invoiceId = resolvedId;
        inv.issuer = msg.sender;
        inv.payer = payer;
        inv.token = token;
        inv.amount = amount;
        inv.dueTimestamp = dueTimestamp;
        inv.encryptedReference = encryptedReference;
        inv.status = requiredApprovers.length == 0 ? InvoiceStatus.Approved : InvoiceStatus.Pending;

        for (uint256 i = 0; i < requiredApprovers.length; ++i) {
            address approver = requiredApprovers[i];
            if (approver == address(0) || isRequiredApprover[resolvedId][approver]) {
                revert InvalidInvoiceParameters();
            }
            isRequiredApprover[resolvedId][approver] = true;
            inv.requiredApprovers.push(approver);
            _indexInvoiceForAccount(approver, resolvedId);
        }

        allInvoiceIds.push(resolvedId);
        _indexInvoiceForAccount(msg.sender, resolvedId);
        if (payer != address(0)) {
            _indexInvoiceForAccount(payer, resolvedId);
        }

        emit InvoiceCreated(
            resolvedId,
            msg.sender,
            payer,
            token,
            amount,
            dueTimestamp,
            encryptedReference,
            requiredApprovers.length,
            block.timestamp
        );
    }

    /// @notice Sign off on a multi-approver invoice (CFO / CEO treasury control).
    function approveInvoice(bytes32 invoiceId) external {
        Invoice storage inv = _invoices[invoiceId];
        if (inv.issuer == address(0)) revert InvoiceNotFound();
        if (inv.status != InvoiceStatus.Pending) revert InvoiceNotPayable();
        if (!isRequiredApprover[invoiceId][msg.sender]) revert UnauthorizedApprover();
        if (hasApproved[invoiceId][msg.sender]) revert AlreadyApproved();

        hasApproved[invoiceId][msg.sender] = true;
        inv.approvalCount += 1;

        bool fullyApproved = inv.approvalCount == inv.requiredApprovers.length;
        if (fullyApproved) {
            inv.status = InvoiceStatus.Approved;
        }

        emit InvoiceApproved(
            invoiceId,
            msg.sender,
            inv.approvalCount,
            inv.requiredApprovers.length,
            fullyApproved,
            block.timestamp
        );
    }

    /// @notice Settle an invoice in 1 click directly to the issuer's wallet.
    function payInvoice(bytes32 invoiceId) external nonReentrant {
        Invoice storage inv = _validatePayableInvoice(invoiceId);
        uint256 fee = effectiveInvoiceFee(invoiceId, msg.sender);
        uint256 netToIssuer = inv.amount - fee;

        inv.status = InvoiceStatus.Settled;
        _indexInvoiceForAccount(msg.sender, invoiceId);

        IERC20 asset = IERC20(inv.token);
        uint256 payerBefore = asset.balanceOf(msg.sender);
        uint256 issuerBefore = asset.balanceOf(inv.issuer);

        asset.safeTransferFrom(msg.sender, inv.issuer, netToIssuer);
        if (fee > 0) {
            asset.safeTransferFrom(msg.sender, address(this), fee);
            _routeInvoiceFee(inv.token, fee);
        }

        if (
            payerBefore - asset.balanceOf(msg.sender) != inv.amount
                || (inv.issuer != msg.sender && asset.balanceOf(inv.issuer) - issuerBefore != netToIssuer)
        ) {
            revert InexactTokenTransfer();
        }

        emit InvoiceSettled(
            invoiceId,
            msg.sender,
            inv.issuer,
            inv.token,
            inv.amount,
            fee,
            false,
            bytes32(0),
            block.timestamp
        );
    }

    /// @notice Settle an invoice confidentially into KudexVault with an optional encrypted note memo.
    function payInvoiceConfidential(
        bytes32 invoiceId,
        bytes32 commitment,
        bytes calldata encryptedMemo
    ) external nonReentrant {
        Invoice storage inv = _validatePayableInvoice(invoiceId);
        if (yieldVault == address(0)) revert ConfidentialVaultUnavailable();

        KudexVault vault = KudexVault(yieldVault);
        if (vault.isDefaulted() || vault.asset() != inv.token) {
            revert ConfidentialVaultUnavailable();
        }

        uint256 fee = effectiveInvoiceFee(invoiceId, msg.sender);
        inv.status = InvoiceStatus.Settled;
        _indexInvoiceForAccount(msg.sender, invoiceId);

        _pullAndShieldConfidential(inv, inv.amount - fee, commitment, encryptedMemo);

        if (fee > 0) {
            _routeInvoiceFee(inv.token, fee);
        }

        emit InvoiceSettled(
            invoiceId,
            msg.sender,
            inv.issuer,
            inv.token,
            inv.amount,
            fee,
            true,
            commitment,
            block.timestamp
        );
    }

    function _pullAndShieldConfidential(
        Invoice storage inv,
        uint256 netShielded,
        bytes32 commitment,
        bytes calldata encryptedMemo
    ) private {
        IERC20 asset = IERC20(inv.token);
        uint256 payerBefore = asset.balanceOf(msg.sender);
        asset.safeTransferFrom(msg.sender, address(this), inv.amount);
        if (payerBefore - asset.balanceOf(msg.sender) != inv.amount) {
            revert InexactTokenTransfer();
        }

        asset.forceApprove(yieldVault, netShielded);
        KudexVault(yieldVault).shieldDeposit(netShielded, commitment, inv.issuer, encryptedMemo);
        asset.forceApprove(yieldVault, 0);
    }

    function cancelInvoice(bytes32 invoiceId) external {
        Invoice storage inv = _invoices[invoiceId];
        if (inv.issuer == address(0)) revert InvoiceNotFound();
        if (msg.sender != inv.issuer) revert UnauthorizedIssuer();
        if (inv.status == InvoiceStatus.Settled || inv.status == InvoiceStatus.Cancelled) {
            revert InvoiceNotPayable();
        }

        inv.status = InvoiceStatus.Cancelled;
        emit InvoiceCancelled(invoiceId, msg.sender, block.timestamp);
    }

    function hasFeeWaiver(address payer, address issuer) public view returns (bool) {
        if (potStaking == address(0) || potStaking.code.length == 0) return false;
        IKudexPOTStaking staking = IKudexPOTStaking(potStaking);
        return staking.qualifiesForFeeWaiver(payer) || staking.qualifiesForFeeWaiver(issuer);
    }

    function effectiveInvoiceFee(bytes32 invoiceId, address payer) public view returns (uint256) {
        Invoice storage inv = _invoices[invoiceId];
        if (inv.issuer == address(0) || protocolFeeBps == 0) return 0;
        if (hasFeeWaiver(payer, inv.issuer)) return 0;
        if (yieldVault == address(0) || protectionReserve == address(0)) return 0;

        KudexVault vault = KudexVault(yieldVault);
        if (vault.isDefaulted() || vault.asset() != inv.token) return 0;

        return (inv.amount * protocolFeeBps) / BPS_DENOMINATOR;
    }

    function getInvoice(bytes32 invoiceId) external view returns (Invoice memory) {
        if (_invoices[invoiceId].issuer == address(0)) revert InvoiceNotFound();
        return _invoices[invoiceId];
    }

    function tryGetInvoice(bytes32 invoiceId) external view returns (bool exists, Invoice memory invoice) {
        if (_invoices[invoiceId].issuer == address(0)) {
            return (false, invoice);
        }
        return (true, _invoices[invoiceId]);
    }

    function getInvoicesForAccount(address account) external view returns (bytes32[] memory) {
        return _accountInvoices[account];
    }

    function getTotalInvoicesCount() external view returns (uint256) {
        return allInvoiceIds.length;
    }

    function _validatePayableInvoice(bytes32 invoiceId) internal view returns (Invoice storage inv) {
        inv = _invoices[invoiceId];
        if (inv.issuer == address(0)) revert InvoiceNotFound();
        if (inv.status == InvoiceStatus.Settled || inv.status == InvoiceStatus.Cancelled) {
            revert InvoiceNotPayable();
        }
        if (inv.requiredApprovers.length > 0 && inv.status != InvoiceStatus.Approved) {
            revert ApprovalsIncomplete();
        }
        if (inv.payer != address(0) && msg.sender != inv.payer) {
            revert UnauthorizedPayer();
        }
    }

    function _routeInvoiceFee(address feeToken, uint256 totalFee) internal {
        uint256 stakerShare = 0;
        if (
            potStaking != address(0) && potStaking.code.length > 0
                && IKudexPOTStaking(potStaking).rewardToken() == feeToken
        ) {
            stakerShare = (totalFee * potStakerFeeShareBps) / BPS_DENOMINATOR;
        }

        uint256 vaultShare = stakerShare > 0
            ? (totalFee * vaultFeeShareBps) / BPS_DENOMINATOR
            : (totalFee * 8_000) / BPS_DENOMINATOR;
        uint256 reserveShare = totalFee - stakerShare - vaultShare;

        if (stakerShare > 0) {
            IERC20(feeToken).forceApprove(potStaking, stakerShare);
            IKudexPOTStaking(potStaking).distributeProtocolRevenue(stakerShare);
            IERC20(feeToken).forceApprove(potStaking, 0);
        }
        if (vaultShare > 0) {
            IERC20(feeToken).forceApprove(yieldVault, vaultShare);
            KudexVault(yieldVault).distributeYield(vaultShare);
            IERC20(feeToken).forceApprove(yieldVault, 0);
        }
        if (reserveShare > 0) {
            IERC20(feeToken).forceApprove(protectionReserve, reserveShare);
            KudexDaaSAdapter(protectionReserve).fundReserve(feeToken, reserveShare);
            IERC20(feeToken).forceApprove(protectionReserve, 0);
        }
    }

    function _indexInvoiceForAccount(address account, bytes32 invoiceId) internal {
        if (account != address(0) && !_accountInvoiceIndexed[account][invoiceId]) {
            _accountInvoiceIndexed[account][invoiceId] = true;
            _accountInvoices[account].push(invoiceId);
        }
    }
}
