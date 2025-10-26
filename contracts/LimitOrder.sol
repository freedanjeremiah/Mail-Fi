// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title ERC20 Limit Order Contract
/// @notice Users can place token swap orders at target prices
contract LimitOrder is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Order {
        address owner;
        IERC20 sellToken;
        IERC20 buyToken;
        uint256 sellAmount;
        uint256 targetPrice; // price * 1e18
        bool fulfilled;
    }

    uint256 public orderCount;
    mapping(uint256 => Order) public orders;

    event OrderPlaced(uint256 indexed id, address indexed owner);
    event OrderFulfilled(uint256 indexed id, address indexed fulfiller);
    event OrderCancelled(uint256 indexed id);

    function placeOrder(
        IERC20 sellToken,
        IERC20 buyToken,
        uint256 sellAmount,
        uint256 targetPrice
    ) external returns (uint256) {
        require(sellAmount > 0, "Amount must be > 0");
        require(targetPrice > 0, "Target price must be > 0");

        uint256 id = orderCount++;
        orders[id] = Order({
            owner: msg.sender,
            sellToken: sellToken,
            buyToken: buyToken,
            sellAmount: sellAmount,
            targetPrice: targetPrice,
            fulfilled: false
        });

        sellToken.safeTransferFrom(msg.sender, address(this), sellAmount);
        emit OrderPlaced(id, msg.sender);
        return id;
    }

    /// @notice Fulfill an order if price conditions met
    function fulfillOrder(uint256 id, uint256 buyAmount) external nonReentrant {
        Order storage o = orders[id];
        require(!o.fulfilled, "Order already fulfilled");
        require(buyAmount >= o.sellAmount * o.targetPrice / 1e18, "Price not met");

        o.fulfilled = true;
        o.buyToken.safeTransferFrom(msg.sender, address(this), buyAmount);
        o.sellToken.safeTransfer(msg.sender, o.sellAmount);
        o.buyToken.safeTransfer(o.owner, buyAmount);

        emit OrderFulfilled(id, msg.sender);
    }

    function cancelOrder(uint256 id) external nonReentrant {
        Order storage o = orders[id];
        require(msg.sender == o.owner, "Not owner");
        require(!o.fulfilled, "Already fulfilled");

        o.fulfilled = true; // mark cancelled
        o.sellToken.safeTransfer(o.owner, o.sellAmount);
        emit OrderCancelled(id);
    }
}
