import React from "react";
import CreateCampaign from "./components/CreateCampaign.jsx";
import CampaignList from "./components/CampaignList.jsx";

function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Crowdfunding DApp</h1>

      {/* 1. Form to deploy new campaigns */}
      <CreateCampaign />

      <hr style={{ margin: "2rem 0" }} />

      {/* 2. List displaying active campaigns + Contribute forms */}
      <CampaignList />
    </div>
  );
}

export default App;
