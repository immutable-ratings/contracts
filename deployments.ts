import { parseUsdc } from "./test/v2/tokens.test";

export interface ImmutableRatingsContracts {
  TUP: string;
  TDN: string;
  ImmutableRatings: string;
}

export const deployments: Record<number, ImmutableRatingsContracts> = {
  // Base Mainnet
  [8453]: {
    TUP: "0xE6D3d08a6519F1346344bba0F25A6fE7aB50F06C",
    TDN: "0x4461a66A7B5eCdBBE0bbBf09b41816f94c4834b2",
    ImmutableRatings: "0xE07f02ff153d2e4F20cEbcEe7C3478243Bab442f",
  },
  // Base Sepolia
  [84532]: {
    TUP: "0x9E8765f0958F7FafD5c15F4F24E7e0a9c03f61e1",
    TDN: "0x14932F95a27364e9d27E899EBA1f6F54C11429b4",
    ImmutableRatings: "0xa7F2e133604A663395d7E4f008faCB94c097DcB3",
  },
};

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
};

export const getConfig = (chainId: number) => {
  return deployConfig[chainId as keyof typeof deployConfig];
};
