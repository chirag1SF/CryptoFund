import React, { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";

const FACTORY_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const FACTORY_ABI = [
  "function createCampaign(uint256 _goal, uint256 _duration) external returns (address)",
  "event CampaignCreated(address indexed campaignAddress, address indexed creator, uint256 goal, uint256 deadline)",
];

export default function CreateCampaign() {
  const { signer, account, connectWallet } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goalEth: "",
    durationDays: "",
    category: "Tech",
    imageURL: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signer) return alert("Please connect your wallet first.");

    if (
      parseFloat(formData.goalEth) <= 0 ||
      parseInt(formData.durationDays) <= 0
    ) {
      return alert("Goal and duration must be greater than zero.");
    }

    setLoading(true);
    try {
      const factoryContract = new ethers.Contract(
        FACTORY_ADDRESS,
        FACTORY_ABI,
        signer,
      );

      // 1. Convert days input into seconds for Solidity compatibility
      const goalInWei = ethers.parseEther(formData.goalEth);
      const durationInSeconds = BigInt(formData.durationDays) * 86400n; // 86400 seconds = 1 day

      // 2. Send creation transaction to Hardhat Factory contract
      const tx = await factoryContract.createCampaign(
        goalInWei,
        durationInSeconds,
        { gasLimit: 3000000 },
      );

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();

      // Ensure transaction actually succeeded on-chain before processing logs
      if (receipt.status === 0) {
        throw new Error("Transaction reverted on-chain.");
      }

      // 3. Extract the new child Crowdfund address from event logs
      let deployedContractAddress = null;

      for (const log of receipt.logs) {
        try {
          const parsedLog = factoryContract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === "CampaignCreated") {
            deployedContractAddress =
              parsedLog.args.campaignAddress || parsedLog.args[0];
            break;
          }
        } catch (err) {
          // Skip logs from other events or contracts
        }
      }

      if (!deployedContractAddress) {
        throw new Error(
          "Failed to retrieve campaign address from transaction logs.",
        );
      }

      // 4. Save metadata to Express backend
      const response = await fetch("http://localhost:5000/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAddress: deployedContractAddress,
          creatorAddress: account,
          title: formData.title,
          description: formData.description,
          goal: formData.goalEth,
          duration: formData.durationDays,
          imageURL: formData.imageURL,
          category: formData.category,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to save off-chain metadata");
      }

      alert(`Campaign successfully created at: ${deployedContractAddress}`);

      // Reset form on success
      setFormData({
        title: "",
        description: "",
        goalEth: "",
        durationDays: "",
        category: "Tech",
        imageURL: "",
      });
    } catch (err) {
      console.error("Create Campaign Error:", err);
      alert(err.reason || err.message || "Error creating campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1rem" }}>
      <h2>Create Campaign</h2>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <br />
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            required
          />
          <br />
          <input
            name="goalEth"
            type="number"
            step="0.01"
            placeholder="Goal (ETH)"
            value={formData.goalEth}
            onChange={handleChange}
            required
          />
          <br />
          <input
            name="durationDays"
            type="number"
            placeholder="Duration (Days)"
            value={formData.durationDays}
            onChange={handleChange}
            required
          />
          <br />
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="Tech">Tech</option>
            <option value="Art">Art</option>
            <option value="DeFi">DeFi</option>
          </select>
          <br />
          <input
            name="imageURL"
            placeholder="Image URL"
            value={formData.imageURL}
            onChange={handleChange}
            required
          />
          <br />
          <button type="submit" disabled={loading}>
            {loading ? "Deploying & Registering..." : "Create Campaign"}
          </button>
        </form>
      )}
    </div>
  );
}
