// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title USDC Investment Escrow with Admin Approval
/// @notice Enables startups to raise funds in USDC from investors, held in escrow until approved or refunded
/// @dev Built on Base Sepolia network for testing
contract USDC_InvestmentEscrow is ReentrancyGuard {
    IERC20 public immutable usdc;
    address public immutable admin;

    uint256 public projectCount;
    uint256[] public projectIds;

    enum ProjectStatus { Pending, Approved, Rejected, Released, Refunded }

    struct Project {
        address founder;         // Project owner
        uint256 targetRaise;     // Target USDC to raise
        uint256 totalInvested;   // Total raised so far
        uint256 deadline;        // Deadline for investment round
        uint256 valuation;       // Company valuation in USDC
        uint256 equityOffered;   // % equity offered (e.g., 10 means 10%)
        uint256 minInvestment;   // Minimum per investor
        uint256 maxInvestment;   // Max per investor (optional)
        bool released;           // Funds released to founder
        ProjectStatus status;    // Project lifecycle state
        string name;             // Project name
        string description;      // Description / pitch
        string category;         // Industry / sector
        string imageUrl;         // Project image
    }

    mapping(uint256 => Project) public projects;
    mapping(uint256 => mapping(address => uint256)) public investments;

    // Events
    event ProjectCreated(uint256 indexed id, address indexed founder);
    event Invested(uint256 indexed id, address indexed investor, uint256 amount);
    event Approved(uint256 indexed id);
    event Rejected(uint256 indexed id);
    event Released(uint256 indexed id, uint256 total);
    event Refunded(uint256 indexed id, address indexed investor, uint256 amount);

    constructor(address _usdcAddr, address _admin) {
        usdc = IERC20(_usdcAddr);
        admin = _admin;
    }

    /// @notice Founder creates a new project for fundraising
    function createProject(
        uint256 targetRaise,
        uint256 durationSeconds,
        uint256 valuation,
        uint256 equityOffered,
        uint256 minInvestment,
        uint256 maxInvestment,
        string calldata name,
        string calldata description,
        string calldata category,
        string calldata imageUrl
    ) external {
        require(targetRaise > 0, "Invalid target");
        require(durationSeconds > 0, "Invalid duration");
        require(equityOffered > 0 && equityOffered <= 100, "Invalid equity");

        uint256 id = projectCount++;
        Project storage p = projects[id];
        p.founder = msg.sender;
        p.targetRaise = targetRaise;
        p.deadline = block.timestamp + durationSeconds;
        p.valuation = valuation;
        p.equityOffered = equityOffered;
        p.minInvestment = minInvestment;
        p.maxInvestment = maxInvestment;
        p.name = name;
        p.description = description;
        p.category = category;
        p.imageUrl = imageUrl;
        p.status = ProjectStatus.Pending;

        projectIds.push(id);
        emit ProjectCreated(id, msg.sender);
    }

    /// @notice Investors contribute USDC into a project
    function invest(uint256 id, uint256 amount) external nonReentrant {
        Project storage p = projects[id];
        require(block.timestamp <= p.deadline, "Deadline passed");
        require(p.status == ProjectStatus.Pending, "Not accepting investments");
        require(amount >= p.minInvestment, "Below minimum");
        if (p.maxInvestment > 0) require(amount <= p.maxInvestment, "Above maximum");

        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");

        investments[id][msg.sender] += amount;
        p.totalInvested += amount;
        emit Invested(id, msg.sender, amount);
    }

    /// @notice Admin approves the project to release funds
    function approveProject(uint256 id) external {
        require(msg.sender == admin, "Only admin");
        Project storage p = projects[id];
        require(p.status == ProjectStatus.Pending, "Invalid status");

        p.status = ProjectStatus.Approved;
        emit Approved(id);
    }

    /// @notice Admin rejects the project (enables refunds)
    function rejectProject(uint256 id) external {
        require(msg.sender == admin, "Only admin");
        Project storage p = projects[id];
        require(p.status == ProjectStatus.Pending, "Invalid status");

        p.status = ProjectStatus.Rejected;
        emit Rejected(id);
    }

    /// @notice Founder claims raised funds if approved and deadline passed
    function releaseFunds(uint256 id) external nonReentrant {
        Project storage p = projects[id];
        require(msg.sender == p.founder, "Only founder");
        require(p.status == ProjectStatus.Approved, "Not approved");
        require(block.timestamp > p.deadline, "Still active");
        require(!p.released, "Already released");

        p.released = true;
        p.status = ProjectStatus.Released;
        uint256 total = p.totalInvested;
        require(usdc.transfer(p.founder, total), "USDC transfer failed");

        emit Released(id, total);
    }

    /// @notice Investors can refund if project rejected or failed to reach target
    function refund(uint256 id) external nonReentrant {
        Project storage p = projects[id];
        require(
            p.status == ProjectStatus.Rejected ||
            (block.timestamp > p.deadline && p.totalInvested < p.targetRaise),
            "Not refundable"
        );

        uint256 bal = investments[id][msg.sender];
        require(bal > 0, "No investment found");

        investments[id][msg.sender] = 0;
        require(usdc.transfer(msg.sender, bal), "Refund failed");

        emit Refunded(id, msg.sender, bal);
    }

    /// @notice View all projects (for frontend)
    function getAllProjects() external view returns (Project[] memory) {
        uint256 count = projectIds.length;
        Project[] memory list = new Project[](count);
        for (uint256 i = 0; i < count; i++) {
            list[i] = projects[projectIds[i]];
        }
        return list;
    }
}
