import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import TokenSender from '../components/TokenSender'; 

const SendPage: React.FC = () => {
  const { connected, publicKey } = useWallet();

  return (
    <div className="send-token-container max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
        Send SPL Tokens
      </h1>

      {connected && publicKey ? (
        <TokenSender />
      ) : (
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-yellow-300 dark:border-yellow-600">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">Connect Your Wallet</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please connect your wallet to send tokens.
          </p>
          <WalletMultiButton className="!bg-indigo-600 !text-white hover:!bg-indigo-700 font-semibold" />
        </div>
      )}

       <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center">
          Sending tokens requires SOL for transaction fees. If the recipient doesn't have an account for this token, you will also pay the rent (~0.002 SOL) to create it for them.
      </p>
    </div>
  );
};

export default SendPage;