import assert from "assert";
import { ethers } from "ethers";
import { type DeployFunction } from "hardhat-deploy/types";

const contractName = "UniversalMappingProtocol";

const deploy: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments } = hre;

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  assert(deployer, "Missing named deployer account");

  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${deployer}`);

  const salt = ethers.keccak256(ethers.toUtf8Bytes("Universal_Mapping_Protocol"));

  const { address } = await deploy(contractName, {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: true,
    deterministicDeployment: salt,
  });

  console.log(`Deployed contract: ${contractName}, network: ${hre.network.name}, address: ${address}`);
};

deploy.tags = [contractName];

export default deploy;
