import React, { useState } from "react";
import { ethers } from "ethers";

// Full ABI including standard getters to prevent <unrecognized-selector> errors
const CrowdfundABI = [
  "function contribute() external payable",
  "function totalRaised() view returns (uint256)",
  "function goal() view returns (uint256)",
  "function deadline() view returns (uint256)",
  "function creator() view returns (address)",
  "function state() view returns (uint8)",
];

export default function ContributeForm({
  campaignAddress,
  onContributionSuccess,
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContribute = async (e) => {
    e.preventDefault();

    if (!window.ethereum) {
      return alert("MetaMask is required to contribute!");
    }

    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      return alert("Invalid campaign address!");
    }

    if (!amount || parseFloat(amount) <= 0) {
      return alert("Enter a valid ETH amount");
    }

    try {
      setLoading(true);

      // 1. Connect to user's wallet via Ethers v6
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // 2. Connect to the specific Crowdfund contract instance
      const campaignContract = new ethers.Contract(
        campaignAddress,
        CrowdfundABI,
        signer,
      );

      // 3. Send the contribution transaction
      const tx = await campaignContract.contribute({
        value: ethers.parseEther(amount),
      });

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait(); // Wait for Hardhat block confirmation
      console.log("Transaction mined in block:", receipt.blockNumber);

      // 4. Notify Express backend to record contribution in DB
      try {
        await fetch(
          `http://localhost:5000/api/campaigns/${campaignAddress}/contribute`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contributor: userAddress,
              amount: amount,
              txHash: tx.hash,
            }),
          },
        );
      } catch (dbError) {
        console.warn(
          "Backend update failed, but on-chain tx succeeded:",
          dbError,
        );
      }

      alert(`Successfully pledged ${amount} ETH!`);
      setAmount("");
      if (onContributionSuccess) onContributionSuccess();
    } catch (error) {
      console.error("Contribution error:", error);
      const errorMessage =
        error?.reason ||
        error?.shortMessage ||
        error?.message ||
        "Transaction failed";
      alert("Contribution failed: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleContribute} style={{ marginTop: "1rem" }}>
      <h4>Pledge to this Campaign</h4>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
          type="number"
          step="0.001"
          min="0.001"
          placeholder="ETH Amount (e.g. 0.5)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Pledge ETH"}
        </button>
      </div>
    </form>
  );
}
