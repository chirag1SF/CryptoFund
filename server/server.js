const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors()); // Fixes "Failed to fetch" CORS issue
app.use(express.json());

// In-memory array instead of MongoDB
const campaigns = [];

// API endpoints
app.post("/api/campaigns", (req, res) => {
  console.log("New campaign received:", req.body);
  campaigns.push(req.body);
  res.status(201).json({ success: true, campaign: req.body });
});

app.get("/api/campaigns", (req, res) => {
  res.json(campaigns);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
