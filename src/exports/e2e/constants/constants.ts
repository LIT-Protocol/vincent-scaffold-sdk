import { defineChain } from "viem";
import { ENV } from "../managers/env-manager";

export const YELLOWSTONE_CHAIN = defineChain({
  id: 175188,
  name: "Chronicle Yellowstone",
  network: "yellowstone",
  nativeCurrency: {
    name: "Chronicle Yellowstone",
    decimals: 18,
    symbol: "tstLPX",
  },
  rpcUrls: {
    default: {
      http: [ENV.YELLOWSTONE_RPC_URL],
    },
    public: {
      http: [ENV.YELLOWSTONE_RPC_URL],
    },
  },
});

export const BASE_CHAIN = defineChain({
  id: 8453,
  name: "Base Mainnet",
  network: "base",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [ENV.BASE_RPC_URL],
    },
    public: {
      http: [ENV.BASE_RPC_URL],
    },
  },
});

export const MOCK_DATA = {
  // Vincent App Registration Constants
  APP_NAME: "E2E Test App",
  APP_DESCRIPTION: "E2E Test Application for Vincent Ability Testing",
  AUTHORIZED_REDIRECT_URIS: ["https://testing.vincent.com"],
};

export const DEPLOYMENT_STATUS = {
  DEV: 0,
  STAGING: 1,
  PRODUCTION: 2,
} as const;

export const STATUS_TO_DEPLOYMENT_STATUS = {
  dev: DEPLOYMENT_STATUS.DEV,
  staging: DEPLOYMENT_STATUS.STAGING,
  production: DEPLOYMENT_STATUS.PRODUCTION,
} as const;

export const PARAMETER_TYPE = {
  INT256: 0,
  INT256_ARRAY: 1,
  UINT256: 2,
  UINT256_ARRAY: 3,
  BOOL: 4,
  BOOL_ARRAY: 5,
  ADDRESS: 6,
  ADDRESS_ARRAY: 7,
  STRING: 8,
  STRING_ARRAY: 9,
  BYTES: 10,
  BYTES_ARRAY: 11,
} as const;
