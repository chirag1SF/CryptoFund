const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// In-memory array storage
const campaigns = [];

// GET /api/campaigns - Fetch all campaigns
app.get("/api/campaigns", (req, res) => {
  res.json(campaigns);
});

// POST /api/campaigns - Create new campaign
app.post("/api/campaigns", (req, res) => {
  console.log("New campaign received:", req.body);
  const newCampaign = {
    ...req.body,
    raisedAmount: "0",
    backers: [],
  };
  campaigns.push(newCampaign);
  res.status(201).json({ success: true, campaign: newCampaign });
});

// DELETE /api/campaigns - Clear all in-memory campaigns
// Call this after every Hardhat restart/redeploy. Hardhat's local chain
// resets to genesis on restart, but this in-memory array does not, so old
// campaign rows keep pointing at contract addresses that no longer exist.
// Wiping the array here keeps the backend in sync without having to
// remember to restart the whole server process.
app.delete("/api/campaigns", (req, res) => {
  campaigns.length = 0;
  console.log("All campaigns cleared.");
  res.status(200).json({ success: true, message: "All campaigns cleared." });
});

// POST /api/campaigns/:address/contribute - Record contribution
app.post("/api/campaigns/:address/contribute", (req, res) => {
  const { address } = req.params;
  const { contributor, amount } = req.body;

  try {
    // Find campaign by address (case-insensitive)
    const campaign = campaigns.find(
      (c) => c.contractAddress.toLowerCase() === address.toLowerCase(),
    );

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Update total raised and record backer details
    const currentRaised = parseFloat(campaign.raisedAmount || 0);
    const newAmount = parseFloat(amount || 0);
    campaign.raisedAmount = (currentRaised + newAmount).toString();

    campaign.backers = campaign.backers || [];
    campaign.backers.push({
      contributor,
      amount,
      date: new Date(),
    });

    console.log(
      `Updated campaign ${address}: Raised ${campaign.raisedAmount} ETH`,
    );
    res.status(200).json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
