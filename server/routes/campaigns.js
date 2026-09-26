import express from "express";
import Campaign from "./models/Campaign.js";

const router = express.Router();

// POST /api/campaigns - Store off-chain metadata
router.post("/campaigns", async (req, res) => {
  try {
    const {
      contractAddress,
      creatorAddress,
      title,
      description,
      imageURL,
      category,
    } = req.body;

    if (
      !contractAddress ||
      !creatorAddress ||
      !title ||
      !description ||
      !imageURL ||
      !category
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newCampaign = new Campaign({
      contractAddress: contractAddress.toLowerCase(),
      creatorAddress: creatorAddress.toLowerCase(),
      title,
      description,
      imageURL,
      category,
    });

    await newCampaign.save();
    return res.status(201).json({ success: true, data: newCampaign });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: "Campaign contract address already exists" });
    }
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/campaigns - Query campaigns with search and category filtering
router.get("/campaigns", async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 });
    return res
      .status(200)
      .json({ success: true, count: campaigns.length, data: campaigns });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
