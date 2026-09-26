const express = require("express");
const router = express.Router();
const Campaign = require("../models/Campaign");

// POST /api/campaigns/:address/contribute - Record a backer contribution
router.post("/:address/contribute", async (req, res) => {
  const { address } = req.params;
  const { contributor, amount } = req.body;

  try {
    // If using MongoDB:
    const campaign = await Campaign.findOne({ contractAddress: address });
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Update total raised and add backer record
    campaign.raisedAmount = (
      parseFloat(campaign.raisedAmount || 0) + parseFloat(amount)
    ).toString();
    campaign.backers = campaign.backers || [];
    campaign.backers.push({ contributor, amount, date: new Date() });

    await campaign.save();
    res.status(200).json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
