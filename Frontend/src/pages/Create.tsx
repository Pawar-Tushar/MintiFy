import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react'; 
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'; 

import TokenCreator from '../components/TokenCreator'; 
const CreatePage: React.FC = () => {
  const { connected, publicKey } = useWallet(); 

  return (
<div className="create-token-container max-w-2xl mx-auto">
  <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
    Create New SPL Token
  </h1>

  {connected && publicKey ? (
    <TokenCreator />
  ) : (
    <div className="text-center p-8 bg-white rounded-lg shadow-md border border-yellow-300">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Connect Your Wallet</h2>
      <p className="text-gray-600 mb-6">
        Please connect your Solana wallet (e.g., Phantom, Solflare) on the Devnet to create a new token.
      </p>
      <WalletMultiButton className="!bg-indigo-600 !text-white hover:!bg-indigo-700 font-semibold" />
    </div>
  )}

  <p className="text-sm text-gray-500 mt-6 text-center">
    Remember to acquire Devnet SOL from a faucet if needed for transaction fees. Creating a token requires a small amount of SOL for rent exemption.
  </p>
</div>

  );
};

export default CreatePage;