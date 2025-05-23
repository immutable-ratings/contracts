import assert from "assert";
import { type DeployFunction } from "hardhat-deploy/types";

import { getConfig } from "../deployments";

const contractName = "ImmutableRatings";

const deploy: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments } = hre;

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  assert(deployer, "Missing named deployer account");

  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${deployer}`);

  const { receiver } = getConfig(hre.network.config.chainId!);

  const tup = await deployments.get("TUP");
  const tdn = await deployments.get("TDN");

  const { address } = await deploy(contractName, {
    from: deployer,
    args: [tup.address, tdn.address, receiver],
    log: true,
    skipIfAlreadyDeployed: false,
  });

  console.log(`Deployed contract: ${contractName}, network: ${hre.network.name}, address: ${address}`);
};

deploy.tags = [contractName];

export default deploy;
