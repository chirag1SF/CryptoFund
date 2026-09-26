import React from "react";
import { CreateCampaign } from "./components/CreateCampaign";

function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <header style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1>Crowdfunding DApp</h1>
      </header>
      <main>
        <CreateCampaign />
      </main>
    </div>
  );
}

export default App;
