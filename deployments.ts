import { parseUsdc } from "./test/v2/tokens.test";

export const deployConfig = {
  31337: {
    receiver: "0x30e7120ce8c0ABA197f1C4EccF2F4E1e1C75ab1d", // https://app.splits.org/accounts/0x30e7120ce8c0ABA197f1C4EccF2F4E1e1C75ab1d/?chainId=84532
    paymentToken: "0x9040dBA0e68d3B45983F3767cC5667c5f1873059", // mUSDC
    swapRouter: "0x2626664c2603336E57B271c5C0b26F421741e481", // Uniswap V3 Swap Router
    ratingPrice: parseUsdc("0.1"),
  },
  // Base Sepolia
  84532: {
    receiver: "0x30e7120ce8c0ABA197f1C4EccF2F4E1e1C75ab1d", // https://app.splits.org/accounts/0x30e7120ce8c0ABA197f1C4EccF2F4E1e1C75ab1d/?chainId=84532
    paymentToken: "0x9040dBA0e68d3B45983F3767cC5667c5f1873059", // mUSDC
    swapRouter: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4", // Uniswap V3 Swap Router
    ratingPrice: parseUsdc("0.0001"),
  },
  // Base Mainnet
  8453: {
    receiver: "0xc1Ec5b421905290F477C741ADf97c062921AA18A", // https://app.splits.org/accounts/0xc1Ec5b421905290F477C741ADf97c062921AA18A/?chainId=8453
    paymentToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
    swapRouter: "0x2626664c2603336E57B271c5C0b26F421741e481", // Uniswap V3 Swap Router
    ratingPrice: parseUsdc("0.0001"),
  },
  11155111: {
    receiver: "0xfC664488cCf05B8e88Ac52EBB3536529b06Ec11E", // https://app.splits.org/accounts/0x30e7120ce8c0ABA197f1C4EccF2F4E1e1C75ab1d/?chainId=84532
    paymentToken: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // USDC
    swapRouter: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E", // Uniswap V3 Swap Router
    ratingPrice: parseUsdc("0.0001"),
  },
  // Arbitrum
  42161: {
    receiver: "0x78a7d1bF8B952273b2853d01fc76b0114ccE694a",
    paymentToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    swapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    ratingPrice: parseUsdc("0.0001"),
  },
};

export const getConfig = (chainId: number) => {
  return deployConfig[chainId as keyof typeof deployConfig];
};
