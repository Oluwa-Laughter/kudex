// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IKudexPOTStaking {
    function qualifiesForFeeWaiver(address account) external view returns (bool);
    function stakedBalanceOf(address account) external view returns (uint256);
    function rewardToken() external view returns (address);
    function distributeProtocolRevenue(uint256 amount) external;
}

/**
 * @title KudexPOTStaking
 * @notice Native 14-decimal Portaldot POT Fee-Rebate & Protocol Revenue Staking Vault.
 * @dev Accounts staking at least 100 POT (100 * 10^14 base units) qualify for 0 bps (Fee-Free)
 *      settlement in KudexRFQMarket and KudexInvoiceEscrow while earning protocol fee rewards.
 */
contract KudexPOTStaking is IKudexPOTStaking, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint8 public constant POT_DECIMALS = 14;
    uint256 public constant ONE_POT = 10 ** 14;
    uint256 public constant FEE_WAIVER_THRESHOLD = 100 * ONE_POT; // 100 * 10^14 base units
    uint256 private constant ACC_REWARD_PRECISION = 1e24;

    struct StakePosition {
        uint256 stakedAmount;
        uint256 rewardDebt;
        uint256 pendingRewards;
        uint256 lastStakedAt;
    }

    address public override rewardToken;
    uint256 public totalStaked;
    uint256 public accRewardPerPot;
    uint256 public undistributedRewards;
    uint256 public totalRewardsDistributed;
    uint256 public totalRewardsClaimed;

    mapping(address => StakePosition) public positions;

    event POTStaked(address indexed account, uint256 amount, uint256 totalAccountStake, uint256 timestamp);
    event POTUnstaked(address indexed account, uint256 amount, uint256 remainingStake, uint256 timestamp);
    event POTRewardClaimed(address indexed account, address indexed rewardToken, uint256 amount, uint256 timestamp);
    event ProtocolRevenueDistributed(
        address indexed source,
        address indexed rewardToken,
        uint256 amount,
        uint256 timestamp
    );
    event RewardTokenUpdated(address indexed rewardToken);

    error ZeroAmount();
    error InsufficientStake();
    error NativeTransferFailed();
    error RewardTokenNotConfigured();
    error NoRewardsClaimable();
    error InexactRewardTransfer();

    constructor(address _rewardToken) Ownable(msg.sender) {
        rewardToken = _rewardToken;
    }

    function setRewardToken(address _rewardToken) external onlyOwner {
        if (_rewardToken == address(0) || _rewardToken.code.length == 0) {
            revert RewardTokenNotConfigured();
        }
        rewardToken = _rewardToken;
        emit RewardTokenUpdated(_rewardToken);
    }

    /// @notice Stake native POT (in 14-decimal base units) to unlock 0 bps settlement fees and earn rewards.
    function stakePOT() external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();

        StakePosition storage pos = positions[msg.sender];
        if (pos.stakedAmount > 0) {
            uint256 accumulated = (pos.stakedAmount * accRewardPerPot) / ACC_REWARD_PRECISION;
            if (accumulated > pos.rewardDebt) {
                pos.pendingRewards += accumulated - pos.rewardDebt;
            }
        }

        uint256 previousTotal = totalStaked;
        pos.stakedAmount += msg.value;
        pos.lastStakedAt = block.timestamp;
        totalStaked = previousTotal + msg.value;

        if (undistributedRewards > 0 && totalStaked > 0) {
            accRewardPerPot += (undistributedRewards * ACC_REWARD_PRECISION) / totalStaked;
            undistributedRewards = 0;
        }

        pos.rewardDebt = (pos.stakedAmount * accRewardPerPot) / ACC_REWARD_PRECISION;

        emit POTStaked(msg.sender, msg.value, pos.stakedAmount, block.timestamp);
    }

    /// @notice Withdraw staked native POT while preserving accrued protocol fee rewards.
    function unstakePOT(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        StakePosition storage pos = positions[msg.sender];
        if (pos.stakedAmount < amount) revert InsufficientStake();

        uint256 accumulated = (pos.stakedAmount * accRewardPerPot) / ACC_REWARD_PRECISION;
        if (accumulated > pos.rewardDebt) {
            pos.pendingRewards += accumulated - pos.rewardDebt;
        }

        pos.stakedAmount -= amount;
        totalStaked -= amount;
        pos.rewardDebt = (pos.stakedAmount * accRewardPerPot) / ACC_REWARD_PRECISION;

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert NativeTransferFailed();

        emit POTUnstaked(msg.sender, amount, pos.stakedAmount, block.timestamp);
    }

    /// @notice Receives protocol settlement revenue and distributes it pro-rata to POT stakers.
    function distributeProtocolRevenue(uint256 amount) external override nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (rewardToken == address(0) || rewardToken.code.length == 0) {
            revert RewardTokenNotConfigured();
        }

        IERC20 token = IERC20(rewardToken);
        uint256 beforeBal = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 afterBal = token.balanceOf(address(this));
        if (afterBal != beforeBal + amount) revert InexactRewardTransfer();

        totalRewardsDistributed += amount;
        if (totalStaked > 0) {
            uint256 distributable = amount + undistributedRewards;
            undistributedRewards = 0;
            accRewardPerPot += (distributable * ACC_REWARD_PRECISION) / totalStaked;
        } else {
            undistributedRewards += amount;
        }

        emit ProtocolRevenueDistributed(msg.sender, rewardToken, amount, block.timestamp);
    }

    /// @notice Claim accrued ERC-20 protocol revenue earned by staking POT.
    function claimRewards() external nonReentrant returns (uint256 claimed) {
        if (rewardToken == address(0)) revert RewardTokenNotConfigured();

        StakePosition storage pos = positions[msg.sender];
        uint256 accumulated = (pos.stakedAmount * accRewardPerPot) / ACC_REWARD_PRECISION;
        uint256 newlyEarned = accumulated > pos.rewardDebt ? accumulated - pos.rewardDebt : 0;
        claimed = pos.pendingRewards + newlyEarned;
        if (claimed == 0) revert NoRewardsClaimable();

        pos.pendingRewards = 0;
        pos.rewardDebt = accumulated;
        totalRewardsClaimed += claimed;

        IERC20(rewardToken).safeTransfer(msg.sender, claimed);
        emit POTRewardClaimed(msg.sender, rewardToken, claimed, block.timestamp);
    }

    function qualifiesForFeeWaiver(address account) external view override returns (bool) {
        return positions[account].stakedAmount >= FEE_WAIVER_THRESHOLD;
    }

    function stakedBalanceOf(address account) external view override returns (uint256) {
        return positions[account].stakedAmount;
    }

    function claimableRewards(address account) external view returns (uint256) {
        StakePosition memory pos = positions[account];
        uint256 effectiveAcc = accRewardPerPot;
        if (undistributedRewards > 0 && totalStaked > 0) {
            effectiveAcc += (undistributedRewards * ACC_REWARD_PRECISION) / totalStaked;
        }
        uint256 accumulated = (pos.stakedAmount * effectiveAcc) / ACC_REWARD_PRECISION;
        uint256 newlyEarned = accumulated > pos.rewardDebt ? accumulated - pos.rewardDebt : 0;
        return pos.pendingRewards + newlyEarned;
    }
}
