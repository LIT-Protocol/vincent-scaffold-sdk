import {
  arbitrum,
  arbitrumGoerli,
  arbitrumNova,
  arbitrumSepolia,
  base,
  baseGoerli,
  baseSepolia,
  fraxtal,
  fraxtalSepolia,
  goerli,
  mainnet,
  optimism,
  optimismGoerli,
  optimismSepolia,
  polygon,
  polygonAmoy,
  polygonMumbai,
  sepolia,
  shape,
  shapeSepolia,
  worldChain,
  worldChainSepolia,
  zora,
  zoraSepolia,
  beraChainBartio,
  opbnbMainnet,
  opbnbTestnet,
  soneiumMinato,
  soneiumMainnet,
  unichainMainnet,
  unichainSepolia,
  inkMainnet,
  inkSepolia,
  mekong,
  monadTestnet,
  openlootSepolia,
  gensynTestnet,
  riseTestnet,
  storyMainnet,
  storyAeneid,
  celoAlfajores,
  celoMainnet,
  teaSepolia,
} from "@account-kit/infra";

/**
 * Helper function to get Alchemy chain configuration
 * Supports all chains exported from AlchemyInfra by mapping chainId to the corresponding chain object.
 */
export function getAlchemyChainConfig(chainId: number) {
  // Map of chainId to chain object
  const chainMap: Record<number, any> = {
    [1]: mainnet,
    [5]: goerli,
    [10]: optimism,
    [420]: optimismGoerli,
    [11155420]: optimismSepolia,
    [11155111]: sepolia,
    [137]: polygon,
    [80001]: polygonMumbai,
    [8453]: base,
    [84531]: baseGoerli,
    [84532]: baseSepolia,
    [42161]: arbitrum,
    [42170]: arbitrumNova,
    [421613]: arbitrumGoerli,
    [421614]: arbitrumSepolia,
    [1101]: polygonAmoy,
    [324]: zora, // If zora is mainnet
    [999]: zoraSepolia, // If zoraSepolia is testnet
    [252]: fraxtal, // Fraxtal mainnet
    [2523]: fraxtalSepolia,
    [480]: worldChain,
    [4801]: worldChainSepolia,
    [360]: shape,
    [11011]: shapeSepolia,
    [130]: unichainMainnet,
    [1301]: unichainSepolia,
    [1946]: soneiumMinato,
    [1868]: soneiumMainnet,
    [204]: opbnbMainnet,
    [5611]: opbnbTestnet,
    [80084]: beraChainBartio,
    [57073]: inkMainnet,
    [763373]: inkSepolia,
    [7078815900]: mekong,
    [10143]: monadTestnet,
    [905905]: openlootSepolia,
    [685685]: gensynTestnet,
    [11155931]: riseTestnet,
    [1514]: storyMainnet,
    [1315]: storyAeneid,
    [44787]: celoAlfajores,
    [42220]: celoMainnet,
    [10218]: teaSepolia,
    // Add more mappings as new chains are supported
  };

  if (chainId in chainMap) {
    return chainMap[chainId];
  }

  throw new Error(`Chain ID ${chainId} not supported`);
}
