import React, { useEffect, useState } from "react";
import ContributeForm from "./ContributeForm";
import { ethers } from "ethers";

const CrowdfundABI = [
  "function totalRaised() view returns (uint256)",
  "function goal() view returns (uint256)",
  "function deadline() view returns (uint256)",
  "function owner() view returns (address)",
];

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [liveData, setLiveData] = useState({});

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/campaigns");
      const data = await res.json();
      setCampaigns(data);

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const nextLiveData = {};

        for (const camp of data) {
          if (camp.contractAddress && ethers.isAddress(camp.contractAddress)) {
            try {
              const contract = new ethers.Contract(
                camp.contractAddress,
                CrowdfundABI,
                provider,
              );
              // Fetch both totalRaised AND deadline. The contract's
              // contribute() reverts if either the goal is already met
              // OR the deadline has passed, so the UI has to check both
              // before letting someone submit a pledge (otherwise the
              // tx reverts on-chain and only burns the user's gas).
              const [raised, deadline] = await Promise.all([
                contract.totalRaised(),
                contract.deadline(),
              ]);

              nextLiveData[camp.contractAddress] = {
                raised: ethers.formatEther(raised),
                deadline: Number(deadline), // unix seconds
                failed: false,
              };
            } catch (e) {
              console.warn(
                "Could not fetch on-chain data for:",
                camp.contractAddress,
                e,
              );
              nextLiveData[camp.contractAddress] = { failed: true };
            }
          }
        }
        setLiveData(nextLiveData);
      }
    } catch (err) {
      console.error("Error loading campaigns:", err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Active Campaigns</h2>
      {campaigns.length === 0 ? (
        <p>No campaigns found. Create one above!</p>
      ) : (
        campaigns.map((camp, index) => {
          const entry = liveData[camp.contractAddress];
          const isLoading = entry === undefined;
          const fetchFailed = entry?.failed === true;

          const raised =
            fetchFailed || isLoading ? 0 : parseFloat(entry.raised || 0);
          const goal = parseFloat(camp.goal || 0);
          const isGoalMet =
            !fetchFailed && !isLoading && raised >= goal && goal > 0;

          const nowSeconds = Math.floor(Date.now() / 1000);
          const isExpired =
            !fetchFailed &&
            !isLoading &&
            entry.deadline > 0 &&
            nowSeconds >= entry.deadline;

          const canContribute =
            !fetchFailed && !isLoading && !isGoalMet && !isExpired;

          return (
            <div
              key={camp.contractAddress || index}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
                maxWidth: "400px",
                backgroundColor: isGoalMet ? "#f0fff0" : "#fff",
              }}
            >
              <h3>{camp.title}</h3>
              <p>{camp.description}</p>
              <p>
                <strong>Category:</strong> {camp.category}
              </p>
              <p>
                <strong>Target Goal:</strong> {camp.goal} ETH
              </p>
              <p>
                <strong>Live Raised On-Chain:</strong>{" "}
                {isLoading
                  ? "Loading..."
                  : fetchFailed
                  ? "Unavailable"
                  : `${entry.raised} ETH`}
              </p>
              {!isLoading && !fetchFailed && (
                <p>
                  <strong>Deadline:</strong>{" "}
                  {new Date(entry.deadline * 1000).toLocaleString()}
                </p>
              )}

              {isGoalMet ? (
                <div
                  style={{
                    color: "green",
                    fontWeight: "bold",
                    marginTop: "1rem",
                  }}
                >
                  🎉 Goal Reached! Campaign Successfully Funded.
                </div>
              ) : isExpired ? (
                <div
                  style={{
                    color: "#b91c1c",
                    fontWeight: "bold",
                    marginTop: "1rem",
                  }}
                >
                  ⏰ This campaign has ended. Pledging is closed.
                </div>
              ) : fetchFailed ? (
                <div
                  style={{
                    color: "#b45309",
                    fontWeight: "bold",
                    marginTop: "1rem",
                  }}
                >
                  ⚠️ Unable to verify this campaign's on-chain status right now.
                  Pledging is disabled until it can be confirmed.
                </div>
              ) : isLoading ? null : (
                canContribute && (
                  <ContributeForm
                    campaignAddress={camp.contractAddress}
                    onContributionSuccess={fetchCampaigns}
                  />
                )
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
