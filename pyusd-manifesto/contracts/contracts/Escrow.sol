// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Escrow
 * @dev Simple escrow contract for PYUSD (or ETH) payments
 */
contract Escrow {
    struct EscrowData {
        address creator;
        address recipient;
        uint256 amount;
        uint256 createdAt;
        uint256 expiryTime;
        bool isClaimed;
        bool isCancelled;
    }

    mapping(uint256 => EscrowData) public escrows;
    uint256 public escrowCounter;

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        uint256 expiryTime
    );

    event EscrowClaimed(uint256 indexed escrowId, address indexed recipient);
    event EscrowCancelled(uint256 indexed escrowId, address indexed creator);

    /**
     * @dev Create a new escrow
     * @param recipient Address that can claim the escrow
     * @param expiryTime Unix timestamp when escrow expires
     */
    function createEscrow(address recipient, uint256 expiryTime) external payable returns (uint256) {
        require(msg.value > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");
        require(expiryTime > block.timestamp, "Expiry must be in the future");

        uint256 escrowId = escrowCounter++;

        escrows[escrowId] = EscrowData({
            creator: msg.sender,
            recipient: recipient,
            amount: msg.value,
            createdAt: block.timestamp,
            expiryTime: expiryTime,
            isClaimed: false,
            isCancelled: false
        });

        emit EscrowCreated(escrowId, msg.sender, recipient, msg.value, expiryTime);

        return escrowId;
    }

    /**
     * @dev Claim escrow funds (only recipient before expiry)
     * @param escrowId The ID of the escrow to claim
     */
    function claimEscrow(uint256 escrowId) external {
        EscrowData storage escrow = escrows[escrowId];

        require(msg.sender == escrow.recipient, "Only recipient can claim");
        require(!escrow.isClaimed, "Already claimed");
        require(!escrow.isCancelled, "Escrow cancelled");
        require(block.timestamp <= escrow.expiryTime, "Escrow expired");

        escrow.isClaimed = true;

        (bool success, ) = escrow.recipient.call{value: escrow.amount}("");
        require(success, "Transfer failed");

        emit EscrowClaimed(escrowId, escrow.recipient);
    }

    /**
     * @dev Cancel escrow and refund (only creator after expiry)
     * @param escrowId The ID of the escrow to cancel
     */
    function cancelEscrow(uint256 escrowId) external {
        EscrowData storage escrow = escrows[escrowId];

        require(msg.sender == escrow.creator, "Only creator can cancel");
        require(!escrow.isClaimed, "Already claimed");
        require(!escrow.isCancelled, "Already cancelled");
        require(block.timestamp > escrow.expiryTime, "Not expired yet");

        escrow.isCancelled = true;

        (bool success, ) = escrow.creator.call{value: escrow.amount}("");
        require(success, "Refund failed");

        emit EscrowCancelled(escrowId, escrow.creator);
    }

    /**
     * @dev Get escrow details
     * @param escrowId The ID of the escrow
     */
    function getEscrow(uint256 escrowId) external view returns (
        address creator,
        address recipient,
        uint256 amount,
        uint256 createdAt,
        uint256 expiryTime,
        bool isClaimed,
        bool isCancelled
    ) {
        EscrowData memory escrow = escrows[escrowId];
        return (
            escrow.creator,
            escrow.recipient,
            escrow.amount,
            escrow.createdAt,
            escrow.expiryTime,
            escrow.isClaimed,
            escrow.isCancelled
        );
    }

    /**
     * @dev Get all escrows created by an address
     * @param creator The creator address
     */
    function getEscrowsByCreator(address creator) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < escrowCounter; i++) {
            if (escrows[i].creator == creator) {
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < escrowCounter; i++) {
            if (escrows[i].creator == creator) {
                result[index] = i;
                index++;
            }
        }

        return result;
    }

    /**
     * @dev Get all escrows for a recipient
     * @param recipient The recipient address
     */
    function getEscrowsByRecipient(address recipient) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < escrowCounter; i++) {
            if (escrows[i].recipient == recipient) {
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < escrowCounter; i++) {
            if (escrows[i].recipient == recipient) {
                result[index] = i;
                index++;
            }
        }

        return result;
    }
}
