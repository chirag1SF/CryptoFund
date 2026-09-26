// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Campaign.sol";

contract CrowdfundFactory {
    address[] public deployedCampaigns;

    event CampaignCreated(
        address indexed campaignAddress,
        address indexed creator,
        uint256 goal,
        uint256 deadline
    );

    function createCampaign(uint256 _goal, uint256 _durationInDays) external returns (address) {
        Campaign newCampaign = new Campaign(msg.sender, _goal, _durationInDays);
        address campaignAddr = address(newCampaign);

        deployedCampaigns.push(campaignAddr);

        emit CampaignCreated(
            campaignAddr,
            msg.sender,
            _goal,
            newCampaign.deadline()
        );

        return campaignAddr;
    }

    function getDeployedCampaigns() external view returns (address[] memory) {
        return deployedCampaigns;
    }
}