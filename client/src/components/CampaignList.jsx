import React, { useEffect, useState } from "react";
import ContributeForm from "./ContributeForm";

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState([]);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/campaigns");
      const data = await res.json();
      setCampaigns(data);
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
        campaigns.map((camp, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1rem",
              maxWidth: "400px",
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
              <strong>Contract:</strong> <code>{camp.contractAddress}</code>
            </p>

            {/* Mount ContributeForm and pass the child campaign address */}
            <ContributeForm
              campaignAddress={camp.contractAddress}
              onContributionSuccess={fetchCampaigns}
            />
          </div>
        ))
      )}
    </div>
  );
}
