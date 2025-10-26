// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title USDC Mail Vault
/// @notice Users can lock USDC in vaults with metadata. Admin or designated recipient can release or refund.
contract USDC_MailVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public immutable admin;

    uint256 public vaultCount;
    uint256[] public vaultIds;

    struct Vault {
        address sender;        // Who locked the funds
        address recipient;     // Who can claim the funds
        uint256 amount;        // Amount of USDC locked
        uint256 unlockTime;    // Timestamp after which funds can be released
        bool released;         // Whether funds were released
        string subject;        // Optional subject or note
        string message;        // Optional message
    }

    mapping(uint256 => Vault) public vaults;

    // Tracks how much each sender locked in each vault
    mapping(uint256 => mapping(address => uint256)) public contributions;

    // Events
    event VaultCreated(uint256 indexed id, address indexed sender, address indexed recipient, uint256 amount);
    event Released(uint256 indexed id, address indexed to, uint256 amount);
    event Refunded(uint256 indexed id, address indexed sender, uint256 amount);

    constructor(address _usdcAddr, address _admin) {
        require(_usdcAddr != address(0), "Invalid USDC address");
        usdc = IERC20(_usdcAddr);
        admin = (_admin == address(0)) ? msg.sender : _admin;
    }

    /// @notice Create a new vault and lock funds
    function createVault(
        address recipient,
        uint256 amount,
        uint256 unlockSeconds,
        string calldata subject,
        string calldata message
    ) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(recipient != address(0), "Invalid recipient");

        uint256 id = vaultCount++;
        Vault storage v = vaults[id];
        v.sender = msg.sender;
        v.recipient = recipient;
        v.amount = amount;
        v.unlockTime = block.timestamp + unlockSeconds;
        v.released = false;
        v.subject = subject;
        v.message = message;

        vaultIds.push(id);

        contributions[id][msg.sender] = amount;

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit VaultCreated(id, msg.sender, recipient, amount);
    }

    /// @notice Release funds to recipient
    function release(uint256 id) external nonReentrant {
        Vault storage v = vaults[id];
        require(!v.released, "Already released");
        require(block.timestamp >= v.unlockTime, "Vault locked");
        require(msg.sender == v.recipient || msg.sender == admin, "Not authorized");

        v.released = true;
        uint256 amt = v.amount;
        v.amount = 0;

        usdc.safeTransfer(v.recipient, amt);
        emit Released(id, v.recipient, amt);
    }

    /// @notice Refund sender if not released
    function refund(uint256 id) external nonReentrant {
        Vault storage v = vaults[id];
        require(!v.released, "Already released");
        require(msg.sender == v.sender, "Not sender");

        v.released = true;
        uint256 amt = v.amount;
        v.amount = 0;

        usdc.safeTransfer(v.sender, amt);
        emit Refunded(id, v.sender, amt);
    }

    /// @notice View all vaults
    function getAllVaults() external view returns (Vault[] memory) {
        uint256 count = vaultIds.length;
        Vault[] memory list = new Vault[](count);
        for (uint i = 0; i < count; i++) {
            list[i] = vaults[vaultIds[i]];
        }
        return list;
    }
}
