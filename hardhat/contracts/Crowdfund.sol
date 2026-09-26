// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Crowdfund {
    address public immutable owner;
    uint256 public immutable goal;
    uint256 public immutable deadline;
    uint256 public totalRaised;

    mapping(address => uint256) public contributions;

    event ContributionReceived(address indexed contributor, uint256 amount);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event RefundIssued(address indexed contributor, uint256 amount);

    constructor(address _owner, uint256 _goalInWei, uint256 _durationInSeconds) {
        require(_owner != address(0), "Invalid owner address");
        require(_goalInWei > 0, "Goal must be greater than 0");
        require(_durationInSeconds > 0, "Duration must be greater than 0");

        owner = _owner;
        goal = _goalInWei;
        deadline = block.timestamp + _durationInSeconds;
    }

    /// @notice Pledges ETH to campaign until target or deadline is reached
    function contribute() public payable {
        require(block.timestamp < deadline, "Campaign has ended");
        require(totalRaised < goal, "Campaign goal already achieved");
        require(msg.value > 0, "Contribution must be greater than 0");

        contributions[msg.sender] += msg.value;
        totalRaised += msg.value;

        emit ContributionReceived(msg.sender, msg.value);
    }

    /// @notice Allows campaign owner to withdraw funds if goal was met
    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        require(totalRaised >= goal, "Campaign goal was not reached");

        uint256 balance = address(this).balance;
        require(balance > 0, "No funds available to withdraw");

        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "ETH transfer failed");

        emit FundsWithdrawn(owner, balance);
    }

    /// @notice Allows contributors to claim a refund if the campaign failed
    function refund() external {
        require(block.timestamp >= deadline, "Campaign is still active");
        require(totalRaised < goal, "Campaign succeeded, refunds unavailable");

        uint256 userContribution = contributions[msg.sender];
        require(userContribution > 0, "No contributions to refund");

        contributions[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: userContribution}("");
        require(success, "Refund transfer failed");

        emit RefundIssued(msg.sender, userContribution);
    }

    // Direct transfers route safely through internal contribute()
    receive() external payable {
        contribute();
    }

    fallback() external payable {
        contribute();
    }
}