const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("CrowdfundFactoryModule", (m) => {
  const crowdfundFactory = m.contract("CrowdfundFactory");

  return { crowdfundFactory };
});
