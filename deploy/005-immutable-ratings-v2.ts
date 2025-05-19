import assert from "assert";
import { upgrades } from "hardhat";
import { type DeployFunction } from "hardhat-deploy/types";

import { getConfig } from "../deployments";

const contractName = "ImmutableRatings";

const deploy: DeployFunction = async (hre) => {
  console.log("Deploying");
  const { getNamedAccounts, deployments } = hre;

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  assert(deployer, "Missing named deployer account");

  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${deployer}`);

  const { receiver, swapRouter, paymentToken, ratingPrice } = getConfig(hre.network.config.chainId!);

  const tup = await deployments.get("TUP");
  const tdn = await deployments.get("TDN");
  const immutableMapping = await deployments.get("ImmutableMapping");

  const contractFactory = await hre.ethers.getContractFactory(contractName);
  console.log([tup.address, tdn.address, immutableMapping.address, receiver, swapRouter, paymentToken, ratingPrice]);

  const contract = await upgrades.deployProxy(
    contractFactory,
    [tup.address, tdn.address, immutableMapping.address, receiver, swapRouter, paymentToken, ratingPrice],
    {
      verifySourceCode: true,
    },
  );
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`Deployed contract: ${contractName}, network: ${hre.network.name}, address: ${address}`);
};

deploy.tags = [`${contractName}V2`];

export default deploy;
