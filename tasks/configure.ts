import { task } from "hardhat/config";

task("configure", "Configure the contracts").setAction(async (_, hre) => {
  const { deployments, ethers } = hre;
  const [deployer] = await ethers.getSigners();

  const tup = await deployments.get("TUP");
  const tdn = await deployments.get("TDN");
  const immutableRatings = await deployments.get("ImmutableRatings");

  const TUP = await ethers.getContractAt("TUP", tup.address);
  const TDN = await ethers.getContractAt("TDN", tdn.address);
  //   const ImmutableRatings = await ethers.getContractAt("ImmutableRatings", immutableRatings.address);

  console.log("Setting MINTER_ROLE");

  const MINTER_ROLE = await TUP.MINTER_ROLE();
  await TUP.grantRole(MINTER_ROLE, immutableRatings.address);
  await TDN.grantRole(MINTER_ROLE, immutableRatings.address);

  console.log("Configured ImmutableRatings as MINTER_ROLE");

  console.log("Setting OPERATOR_ROLE");

  const contract = await ethers.getContractAt("ImmutableRatings", immutableRatings.address);
  const OPERATOR_ROLE = await contract.OPERATOR_ROLE();
  await contract.grantRole(OPERATOR_ROLE, deployer.address);

  console.log("Configured ImmutableRatings as OPERATOR_ROLE");
});
