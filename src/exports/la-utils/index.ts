import { getYellowstoneProvider } from "./la-chain/yellowstone/getYellowstoneProvider";
import { yellowstoneConfig } from "./la-chain/yellowstone/yellowstoneConfig";
import { contractCall } from "./la-transactions/handlers/contractCall";
import { nativeSend } from "./la-transactions/handlers/nativeSend";
import { getNonce } from "./la-transactions/primitive/getNonce";
import { sendTx } from "./la-transactions/primitive/sendTx";
import { signTx } from "./la-transactions/primitive/signTx";
import { toEthAddress } from "./la-helpers/toEthAddress";

// Named exports for individual utilities
export {
  getYellowstoneProvider,
  yellowstoneConfig,
  contractCall,
  nativeSend,
  getNonce,
  sendTx,
  signTx,
  toEthAddress,
};

// Organized exports under laUtils object
export const laUtils = {
  chain: {
    getYellowstoneProvider,
    yellowstoneConfig,
  },
  transaction: {
    handler: {
      contractCall,
      nativeSend,
    },
    primitive: {
      getNonce,
      sendTx,
      signTx,
    },
  },
  helpers: {
    toEthAddress,
  },
};

// Default export for convenience
export default laUtils;
