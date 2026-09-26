// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Crowdfund.sol";

contract CrowdfundFactory {
    address[] public deployedCampaigns;

    event CampaignCreated(address indexed campaignAddress, address indexed creator, uint256 goal, uint256 deadline);

    function createCampaign(uint256 _goal, uint256 _duration) external returns (address) {
        Crowdfund newCampaign = new Crowdfund(msg.sender, _goal, _duration);
        address campaignAddr = address(newCampaign);
        deployedCampaigns.push(campaignAddr);

        emit CampaignCreated(campaignAddr, msg.sender, _goal, block.timestamp + _duration);
        return campaignAddr;
    }

    function getDeployedCampaigns() external view returns (address[] memory) {
        return deployedCampaigns;
    }
}