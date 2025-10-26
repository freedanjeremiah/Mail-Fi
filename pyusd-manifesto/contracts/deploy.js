const hre = require("hardhat");

async function main() {
  console.log("Deploying Escrow contract...");

  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy();

  await escrow.waitForDeployment();

  const address = await escrow.getAddress();

  console.log(`✅ Escrow contract deployed to: ${address}`);
  console.log(`Network: ${hre.network.name}`);

  // Wait for block confirmations
  console.log("Waiting for block confirmations...");
  await escrow.deploymentTransaction().wait(5);

  console.log("\n📋 Add this to your .env file:");
  console.log(`ESCROW_CONTRACT_ADDRESS=${address}`);

  console.log("\n🔍 Verify on block explorer:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
