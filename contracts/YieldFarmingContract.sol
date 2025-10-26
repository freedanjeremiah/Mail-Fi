// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title Yield Farming Staking Contract
/// @notice Users stake ERC20 tokens and earn rewards over time
contract YieldFarm is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;
    address public admin;

    uint256 public rewardRatePerSecond; // reward per second per token staked
    uint256 public totalStaked;

    struct Stake {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lastUpdate;
    }

    mapping(address => Stake) public stakes;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);

    constructor(address _stakingToken, address _rewardToken, uint256 _rewardRatePerSecond) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRatePerSecond = _rewardRatePerSecond;
        admin = msg.sender;
    }

    modifier updateReward(address user) {
        Stake storage s = stakes[user];
        if (s.amount > 0) {
            uint256 pending = ((block.timestamp - s.lastUpdate) * s.amount * rewardRatePerSecond) / 1e18;
            s.rewardDebt += pending;
        }
        s.lastUpdate = block.timestamp;
        _;
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        stakes[msg.sender].amount += amount;
        totalStaked += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        Stake storage s = stakes[msg.sender];
        require(amount <= s.amount, "Not enough staked");
        s.amount -= amount;
        totalStaked -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() external nonReentrant updateReward(msg.sender) {
        uint256 reward = stakes[msg.sender].rewardDebt;
        require(reward > 0, "No rewards");
        stakes[msg.sender].rewardDebt = 0;
        rewardToken.safeTransfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
    }

    function setRewardRate(uint256 newRate) external {
        require(msg.sender == admin, "Only admin");
        rewardRatePerSecond = newRate;
        emit RewardRateUpdated(newRate);
    }

    function getPendingReward(address user) external view returns (uint256) {
        Stake memory s = stakes[user];
        if (s.amount == 0) return s.rewardDebt;
        uint256 pending = ((block.timestamp - s.lastUpdate) * s.amount * rewardRatePerSecond) / 1e18;
        return s.rewardDebt + pending;
    }
}
