// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Crowdfund.sol";

contract CrowdfundFactory {
    address[] public deployedCampaigns;

    event CampaignCreated(
        address indexed campaignAddress,
        address indexed creator,
        uint256 goal,
        uint256 deadline
    );

    function createCampaign(uint256 _goal, uint256 _duration) external returns (address) {
        Crowdfund newCampaign = new Crowdfund(msg.sender, _goal, _duration);
        address campaignAddress = address(newCampaign);

        deployedCampaigns.push(campaignAddress);

        emit CampaignCreated(
            campaignAddress,
            msg.sender,
            _goal,
            newCampaign.deadline()
        );

        return campaignAddress;
    }

    function getDeployedCampaigns() external view returns (address[] memory) {
        return deployedCampaigns;
    }
}