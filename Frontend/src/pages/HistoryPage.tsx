import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import TransactionHistory from '../components/TransactionHistory'; 

const HistoryPage: React.FC = () => {
  const { connected, publicKey } = useWallet();

  return (
    <div className="transaction-history-container max-w-3xl mx-auto"> {/* Wider max-width potentially */}
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
        Wallet Transaction History
      </h1>

      {connected && publicKey ? (
        <>
           <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
               Displaying recent transactions involving your wallet address ({publicKey.toBase58().substring(0, 6)}...). Parsing focuses on common SPL token actions.
           </p>
           <TransactionHistory />
        </>
      ) : (
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-yellow-300 dark:border-yellow-600">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">Connect Your Wallet</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please connect your wallet to view its transaction history.
          </p>
          <WalletMultiButton className="!bg-indigo-600 !text-white hover:!bg-indigo-700 font-semibold" /> {/* Use WalletMultiButton standard styling or your custom classes */}
        </div>
      )}

       <p className="text-xs text-gray-400 dark:text-gray-500 mt-6 text-center">
           Note: Complex DeFi interactions might not be fully parsed. Check explorer for full details.
       </p>
    </div>
  );
};

export default HistoryPage;