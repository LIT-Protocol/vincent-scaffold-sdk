export const yellowstoneConfig = {
  id: 175188,
  name: "Chronicle Yellowstone - Lit Protocol Testnet",
  nativeCurrency: {
    name: "Test LPX",
    symbol: "tstLPX",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://yellowstone-rpc.litprotocol.com/"],
      webSocket: [],
    },
    public: {
      http: ["https://yellowstone-rpc.litprotocol.com/"],
      webSocket: [],
    },
  },
  blockExplorers: {
    default: {
      name: "Yellowstone Explorer",
      url: "https://yellowstone-explorer.litprotocol.com/",
    },
  },
};
