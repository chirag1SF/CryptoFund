import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema({
  contractAddress: { type: String, required: true, unique: true, index: true },
  creatorAddress: { type: String, required: true, lowercase: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  imageURL: { type: String, required: true },
  category: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Campaign", campaignSchema);
