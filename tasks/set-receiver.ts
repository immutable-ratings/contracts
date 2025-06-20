import { task } from "hardhat/config";

task("set-receiver", "Set the receiver").setAction(async (_, hre) => {
  const { deployments, ethers } = hre;
  const [deployer] = await ethers.getSigners();

  const receiver = "0xc1Ec5b421905290F477C741ADf97c062921AA18A";

  const deployed = await deployments.get("ImmutableRatings");
  const contract = await ethers.getContractAt("ImmutableRatings", deployed.address);

  console.log("Setting receiver");

  await contract.setReceiver(receiver);

  console.log("Receiver set");
});
