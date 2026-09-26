import React, { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";

const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const FACTORY_ABI = [
  "function createCampaign(uint256 _goal, uint256 _durationInDays) external returns (address)",
  "event CampaignCreated(address indexed campaignAddress, address indexed creator, uint256 goal, uint256 deadline)",
];

export function CreateCampaign() {
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
      // 1. Initialize Contract Instance
      const factoryContract = new ethers.Contract(
        FACTORY_ADDRESS,
        FACTORY_ABI,
        signer,
      );

      // 2. Format Parameters for Ethers v6
      const goalInWei = ethers.parseEther(formData.goalEth);
      const durationInDays = BigInt(formData.durationDays);

      // 3. Trigger Transaction with gasLimit override
      const tx = await factoryContract.createCampaign(
        goalInWei,
        durationInDays,
        { gasLimit: 3000000 },
      );

      const receipt = await tx.wait();

      // 4. Extract new Campaign Address using factoryContract interface
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
          // Skip logs that don't match the contract interface
        }
      }

      // Fallback check
      if (!deployedContractAddress && receipt.logs.length > 0) {
        const lastLog = receipt.logs[receipt.logs.length - 1];
        if (lastLog.args && lastLog.args[0]) {
          deployedContractAddress = lastLog.args[0];
        }
      }

      if (!deployedContractAddress) {
        throw new Error(
          "Failed to retrieve campaign address from transaction logs.",
        );
      }

      // 5. Post Metadata to Express API Backend
      const response = await fetch("http://localhost:5000/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAddress: deployedContractAddress,
          creatorAddress: account,
          title: formData.title,
          description: formData.description,
          imageURL: formData.imageURL,
          category: formData.category,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to save off-chain metadata");
      }

      alert(`Campaign successfully created at: ${deployedContractAddress}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error creating campaign");
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
            onChange={handleChange}
            required
          />
          <br />
          <textarea
            name="description"
            placeholder="Description"
            onChange={handleChange}
            required
          />
          <br />
          <input
            name="goalEth"
            type="number"
            step="0.01"
            placeholder="Goal (ETH)"
            onChange={handleChange}
            required
          />
          <br />
          <input
            name="durationDays"
            type="number"
            placeholder="Duration (Days)"
            onChange={handleChange}
            required
          />
          <br />
          <select name="category" onChange={handleChange}>
            <option value="Tech">Tech</option>
            <option value="Art">Art</option>
            <option value="DeFi">DeFi</option>
          </select>
          <br />
          <input
            name="imageURL"
            placeholder="Image URL"
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
