import { ChainId, Token as UniswapToken } from "@uniswap/sdk-core";
import { parseUnits } from "ethers";

export const parseUsdc = (amount: string) => parseUnits(amount, 6);
export const parseDegen = (amount: string) => parseUnits(amount, 18);

export const tokens = {
  usdc: {
    currency: new UniswapToken(ChainId.BASE, "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 6, "USDC", "USD Coin"),
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    whale: "0xee81B5Afc73Cf528778E0ED98622e434E5eFADb4",
    parse: parseUsdc,
  },
  degen: {
    currency: new UniswapToken(ChainId.BASE, "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", 18, "DEGEN", "Degen"),
    address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed",
    whale: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed",
    parse: parseDegen,
  },
};

export type Token = keyof typeof tokens;
