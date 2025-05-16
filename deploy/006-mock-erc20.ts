import assert from "assert";
import { type DeployFunction } from "hardhat-deploy/types";

const contractName = "MockERC20";

const deploy: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments } = hre;

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  assert(deployer, "Missing named deployer account");

  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${deployer}`);

  const erc20s = [
    {
      name: "Mock USD Coin",
      symbol: "mUSDC",
      decimals: 6,
    },
    {
      name: "Mock Degen",
      symbol: "mDEGEN",
      decimals: 18,
    },
  ];

  for (const erc20 of erc20s) {
    const { address } = await deploy(erc20.symbol, {
      contract: contractName,
      from: deployer,
      args: [erc20.name, erc20.symbol, erc20.decimals],
      log: true,
      skipIfAlreadyDeployed: true,
    });

    console.log(`Deployed contract: ${contractName}, network: ${hre.network.name}, address: ${address}`);
  }
};

deploy.tags = [contractName];

export default deploy;
