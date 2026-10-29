// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @notice Unbacked testnet-only, zero-interest senior/junior principal facility.
/// @dev Document hash is a reference, not issuer verification or legal enforcement.
contract KudexTestCreditFacility is ReentrancyGuard {
    using SafeERC20 for IERC20;
    enum State {
        Funding,
        Active,
        Defaulted,
        Repaid
    }
    IERC20 public immutable asset;
    address public immutable administrator;
    address public immutable borrower;
    bytes32 public immutable documentHash;
    uint256 public immutable seniorTarget;
    uint256 public immutable juniorTarget;
    uint64 public immutable fundingDeadline;
    uint64 public immutable maturity;
    uint64 public immutable grace;
    State public state;
    uint256 public seniorFunded;
    uint256 public juniorFunded;
    uint256 public repaid;
    uint256 public totalClaimed;
    uint256 public totalRefunded;
    mapping(address => bool) public eligible;
    mapping(address => mapping(bool => uint256)) public subscriptions;
    mapping(address => mapping(bool => uint256)) public claimed;
    error InvalidTerms();
    error Unauthorized();
    error InvalidState();
    error InvalidAmount();
    error InexactAsset();
    event Eligibility(address indexed investor, bool permitted);
    event Subscribed(address indexed investor, bool indexed senior, uint256 amount);
    event Disbursed(address indexed borrower, uint256 amount);
    event Repayment(address indexed payer, uint256 amount, State state);
    event DefaultDeclared(uint256 unpaid);
    event Claimed(address indexed investor, bool indexed senior, uint256 amount);
    event Refunded(address indexed investor, bool indexed senior, uint256 amount);

    constructor(
        IERC20 token,
        address admin,
        address debtor,
        bytes32 reference_,
        uint256 senior_,
        uint256 junior_,
        uint64 funding_,
        uint64 maturity_,
        uint64 grace_
    ) {
        if (
            block.chainid != 420420777 || address(token).code.length == 0 || admin == address(0) || debtor == address(0)
                || debtor == address(this) || reference_ == bytes32(0) || senior_ == 0 || junior_ == 0
                || senior_ > type(uint128).max || junior_ > type(uint128).max || funding_ <= block.timestamp
                || maturity_ <= funding_ || grace_ > 30 days || uint256(maturity_) + grace_ > type(uint64).max
        ) revert InvalidTerms();
        asset = token;
        administrator = admin;
        borrower = debtor;
        documentHash = reference_;
        seniorTarget = senior_;
        juniorTarget = junior_;
        fundingDeadline = funding_;
        maturity = maturity_;
        grace = grace_;
    }

    function setEligibility(address investor, bool permitted) external {
        if (msg.sender != administrator) revert Unauthorized();
        eligible[investor] = permitted;
        emit Eligibility(investor, permitted);
    }

    function subscribe(bool senior, uint256 amount) external nonReentrant {
        if (state != State.Funding || block.timestamp >= fundingDeadline) revert InvalidState();
        if (!eligible[msg.sender]) revert Unauthorized();
        uint256 remaining = senior ? seniorTarget - seniorFunded : juniorTarget - juniorFunded;
        if (amount == 0 || amount > remaining) revert InvalidAmount();
        subscriptions[msg.sender][senior] += amount;
        if (senior) seniorFunded += amount;
        else juniorFunded += amount;
        _receive(amount);
        emit Subscribed(msg.sender, senior, amount);
    }

    function disburse() external nonReentrant {
        if (msg.sender != borrower) revert Unauthorized();
        if (
            state != State.Funding || block.timestamp >= fundingDeadline || seniorFunded != seniorTarget
                || juniorFunded != juniorTarget
        ) revert InvalidState();
        state = State.Active;
        _send(borrower, seniorTarget + juniorTarget);
        emit Disbursed(borrower, seniorTarget + juniorTarget);
    }

    function refund(bool senior) external nonReentrant {
        if (state != State.Funding || block.timestamp < fundingDeadline) revert InvalidState();
        uint256 amount = subscriptions[msg.sender][senior];
        if (amount == 0) revert InvalidAmount();
        subscriptions[msg.sender][senior] = 0;
        totalRefunded += amount;
        _send(msg.sender, amount);
        emit Refunded(msg.sender, senior, amount);
    }

    function repay(uint256 amount) external nonReentrant {
        if (state != State.Active && state != State.Defaulted) revert InvalidState();
        if (amount == 0 || amount > seniorTarget + juniorTarget - repaid) revert InvalidAmount();
        repaid += amount;
        if (repaid == seniorTarget + juniorTarget) state = State.Repaid;
        _receive(amount);
        emit Repayment(msg.sender, amount, state);
    }

    function declareDefault() external {
        if (state != State.Active || block.timestamp < uint256(maturity) + grace) revert InvalidState();
        state = State.Defaulted;
        emit DefaultDeclared(seniorTarget + juniorTarget - repaid);
    }

    function claimable(address investor, bool senior) public view returns (uint256) {
        uint256 allocation = senior
            ? Math.min(repaid, seniorTarget)
            : (repaid > seniorTarget ? repaid - seniorTarget : 0);
        return Math.mulDiv(allocation, subscriptions[investor][senior], senior ? seniorTarget : juniorTarget)
            - claimed[investor][senior];
    }

    function claim(bool senior) external nonReentrant {
        uint256 amount = claimable(msg.sender, senior);
        if (amount == 0) revert InvalidAmount();
        claimed[msg.sender][senior] += amount;
        totalClaimed += amount;
        _send(msg.sender, amount);
        emit Claimed(msg.sender, senior, amount);
    }

    function _receive(uint256 amount) private {
        uint256 beforeBalance = asset.balanceOf(address(this));
        uint256 payer = asset.balanceOf(msg.sender);
        asset.safeTransferFrom(msg.sender, address(this), amount);
        if (asset.balanceOf(address(this)) != beforeBalance + amount || asset.balanceOf(msg.sender) != payer - amount) {
            revert InexactAsset();
        }
    }

    function _send(address to, uint256 amount) private {
        uint256 beforeBalance = asset.balanceOf(address(this));
        uint256 receiver = asset.balanceOf(to);
        asset.safeTransfer(to, amount);
        if (asset.balanceOf(address(this)) != beforeBalance - amount || asset.balanceOf(to) != receiver + amount) {
            revert InexactAsset();
        }
    }
}
