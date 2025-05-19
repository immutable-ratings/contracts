import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import dotenv from "dotenv";
import { Wallet } from "ethers";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import "solidity-docgen";

import "./tasks/accounts";
import "./tasks/configure";
import "./tasks/pool";
import "./tasks/verify";

dotenv.config();

// Run 'npx hardhat vars setup' to see the list of variables that need to be set

const privateKey = process.env.PRIVATE_KEY ?? Wallet.createRandom().privateKey;
if (!privateKey) throw new Error("PRIVATE_KEY is not set");
const accounts = [privateKey];

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
  },
  sourcify: {
    enabled: true,
  },
  etherscan: {
    apiKey: {
      base: "P6Y7IMJGJK43EMAQPZK1158NFM15KYUXXS",
      baseSepolia: "P6Y7IMJGJK43EMAQPZK1158NFM15KYUXXS",
      arbitrumOne: vars.get("ARBISCAN_API_KEY", ""),
      avalanche: vars.get("SNOWTRACE_API_KEY", ""),
      bsc: vars.get("BSCSCAN_API_KEY", ""),
      mainnet: vars.get("ETHERSCAN_API_KEY", ""),
      optimisticEthereum: vars.get("OPTIMISM_API_KEY", ""),
      polygon: vars.get("POLYGONSCAN_API_KEY", ""),
      polygonMumbai: vars.get("POLYGONSCAN_API_KEY", ""),
      sepolia: vars.get("ETHERSCAN_API_KEY", ""),
    },
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
    // L1: "ethereum",
    L2: "base",
    L1Etherscan: "TSUMBVQKM4V7IYIV1JW4RRETR4QIMNRWZK",
    // L2Etherscan: "P6Y7IMJGJK43EMAQPZK1158NFM15KYUXXS",
  },
  networks: {
    hardhat: {
      accounts: {
        count: 10,
        mnemonic: Wallet.createRandom().mnemonic?.phrase,
        path: "m/44'/60'/0'/0",
      },
      forking: {
        url: `https://base-mainnet.public.blastapi.io`,
        blockNumber: 30241554,
      },
      chainId: 31337,
    },
    "base-mainnet": {
      url: "https://mainnet.base.org",
      accounts,
      chainId: 8453,
    },
    "base-sepolia": {
      url: "https://sepolia.base.org",
      accounts,
      chainId: 84532,
    },
    sepolia: {
      url: "https://eth-sepolia.public.blastapi.io",
      accounts,
      chainId: 11155111,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.22",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
  docgen: {
    pages: "files",
    exclude: ["v1"],
  },
};

export default config;
