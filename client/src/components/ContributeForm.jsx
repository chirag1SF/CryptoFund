import React, { useState } from "react";
import { ethers } from "ethers";

// Fixed ABI matching Crowdfund.sol definitions
const CrowdfundABI = [
  "function contribute() external payable",
  "function totalRaised() view returns (uint256)",
  "function goal() view returns (uint256)",
  "function deadline() view returns (uint256)",
  "function owner() view returns (address)",
  "function contributions(address) view returns (uint256)",
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

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const campaignContract = new ethers.Contract(
        campaignAddress,
        CrowdfundABI,
        signer,
      );

      const value = ethers.parseEther(amount);

      // Simulate the call first (no gas spent, no MetaMask prompt yet).
      // If the campaign has ended or the goal is already met, this throws
      // immediately with the contract's actual revert reason, so we never
      // ask the user to sign and pay gas for a transaction that's
      // guaranteed to fail on-chain.
      try {
        await campaignContract.contribute.staticCall({ value });
      } catch (simError) {
        const reason =
          simError?.reason ||
          simError?.shortMessage ||
          simError?.message ||
          "This contribution would fail on-chain.";
        alert("Can't contribute right now: " + reason);
        setLoading(false);
        return;
      }

      const tx = await campaignContract.contribute({ value });

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();

      // Defensive check: ethers v6 usually throws on a reverted receipt,
      // but we verify explicitly so a false "success" alert can never
      // slip through.
      if (!receipt || receipt.status === 0) {
        throw new Error("Transaction reverted on-chain.");
      }

      console.log("Transaction mined in block:", receipt.blockNumber);

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
