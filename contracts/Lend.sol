// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title Simple Lending Contract
/// @notice Users can deposit ERC20 tokens, borrow, and repay with interest
contract LendingPool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public admin;

    uint256 public totalDeposits;
    uint256 public interestRatePerSecond; // simple interest

    struct Loan {
        uint256 amount;
        uint256 startTime;
        bool repaid;
    }

    mapping(address => uint256) public deposits;
    mapping(address => Loan) public loans;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);

    constructor(address _token, uint256 _interestRatePerSecond) {
        token = IERC20(_token);
        admin = msg.sender;
        interestRatePerSecond = _interestRatePerSecond;
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot deposit 0");
        deposits[msg.sender] += amount;
        totalDeposits += amount;
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount <= deposits[msg.sender], "Not enough balance");
        deposits[msg.sender] -= amount;
        totalDeposits -= amount;
        token.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function borrow(uint256 amount) external nonReentrant {
        require(loans[msg.sender].amount == 0, "Existing loan");
        require(amount <= totalDeposits, "Insufficient liquidity");

        loans[msg.sender] = Loan({ amount: amount, startTime: block.timestamp, repaid: false });
        totalDeposits -= amount;
        token.safeTransfer(msg.sender, amount);
        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external nonReentrant {
        Loan storage loan = loans[msg.sender];
        require(!loan.repaid, "Already repaid");

        uint256 interest = ((block.timestamp - loan.startTime) * loan.amount * interestRatePerSecond) / 1e18;
        uint256 totalOwed = loan.amount + interest;
        require(amount >= totalOwed, "Insufficient repayment");

        loan.repaid = true;
        totalDeposits += totalOwed;
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Repaid(msg.sender, amount);
    }

    function calculateOwed(address borrower) external view returns (uint256) {
        Loan memory loan = loans[borrower];
        if (loan.repaid || loan.amount == 0) return 0;
        uint256 interest = ((block.timestamp - loan.startTime) * loan.amount * interestRatePerSecond) / 1e18;
        return loan.amount + interest;
    }
}
