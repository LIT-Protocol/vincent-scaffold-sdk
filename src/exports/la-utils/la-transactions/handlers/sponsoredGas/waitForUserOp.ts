import { alchemy } from '@account-kit/infra';
import { LitActionsSmartSigner } from './litActionSmartSigner';
import { createModularAccountV2Client } from '@account-kit/smart-contracts';
import { getAlchemyChainConfig } from '../../../la-helpers/getAlchemyChainConfig';

export const waitForUserOp = async ({
  pkpPublicKey,
  chainId,
  eip7702AlchemyApiKey,
  eip7702AlchemyPolicyId,
  userOp,
}: {
  pkpPublicKey: string;
  chainId: number;
  eip7702AlchemyApiKey: string;
  eip7702AlchemyPolicyId: string;
  userOp: `0x${string}`;
}) => {
  if (!eip7702AlchemyApiKey || !eip7702AlchemyPolicyId) {
    throw new Error(
      "EIP7702 Alchemy API key and policy ID are required when using Alchemy for gas sponsorship"
    );
  }

  if (!chainId) {
    throw new Error(
      "Chain ID is required when using Alchemy for gas sponsorship"
    );
  }

  // Create LitActionsSmartSigner for EIP-7702
  const litSigner = new LitActionsSmartSigner({
    pkpPublicKey,
    chainId,
  });

  // Get the Alchemy chain configuration
  const alchemyChain = getAlchemyChainConfig(chainId);

  // Create the Smart Account Client with EIP-7702 mode
  const smartAccountClient = await createModularAccountV2Client({
    mode: '7702' as const,
    transport: alchemy({ apiKey: eip7702AlchemyApiKey }),
    chain: alchemyChain,
    signer: litSigner,
    policyId: eip7702AlchemyPolicyId,
  });

  // Wait for the bundle to be mined
  const bundleHas = await smartAccountClient.waitForUserOperationTransaction({
    hash: userOp,
  });

  return bundleHas;
};
