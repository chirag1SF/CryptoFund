// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Campaign {
    address public immutable creator;
    uint256 public immutable goal;
    uint256 public immutable deadline;
    uint256 public totalPledged;
    bool public claimed;

    mapping(address => uint256) public pledges;

    event Pledged(address indexed contributor, uint256 amount);
    event Unpledged(address indexed contributor, uint256 amount);
    event Claimed(uint256 amount);
    event Refunded(address indexed contributor, uint256 amount);

    modifier onlyCreator() {
        require(msg.sender == creator, "Not campaign creator");
        _;
    }

    constructor(address _creator, uint256 _goal, uint256 _durationInDays) {
        require(_goal > 0, "Goal must be > 0");
        creator = _creator;
        goal = _goal;
        deadline = block.timestamp + (_durationInDays * 1 days);
    }

    function pledge() external payable {
        require(block.timestamp < deadline, "Campaign has ended");
        require(msg.value > 0, "Must pledge more than 0");

        pledges[msg.sender] += msg.value;
        totalPledged += msg.value;

        emit Pledged(msg.sender, msg.value);
    }

    function claimFunds() external onlyCreator {
        require(block.timestamp >= deadline, "Campaign not ended yet");
        require(totalPledged >= goal, "Goal not reached");
        require(!claimed, "Funds already claimed");

        claimed = true;
        uint256 balance = address(this).balance;

        (bool success, ) = payable(creator).call{value: balance}("");
        require(success, "Transfer failed");

        emit Claimed(balance);
    }

    function refund() external {
        require(block.timestamp >= deadline, "Campaign not ended yet");
        require(totalPledged < goal, "Goal was reached");

        uint256 balance = pledges[msg.sender];
        require(balance > 0, "No funds to refund");

        pledges[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Transfer failed");

        emit Refunded(msg.sender, balance);
    }

    function getCampaignDetails() external view returns (
        address _creator,
        uint256 _goal,
        uint256 _deadline,
        uint256 _totalPledged,
        bool _claimed
    ) {
        return (creator, goal, deadline, totalPledged, claimed);
    }
}