import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import AccountDetails from '../components/AccountDetails'; 
import { Link } from 'react-router-dom';

const PortfolioPage: React.FC = () => {
    const { connected, publicKey } = useWallet();

    return (
        <div className="portfolio-container max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          My Wallet Portfolio
        </h1>
      
        {connected && publicKey ? (
          <div className="space-y-8">
            <AccountDetails />
            <div className="text-center mt-8">
              <Link
                to="/history"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Wallet Activity
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-3 -mr-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-white rounded-lg shadow-md border border-yellow-300">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to view your account details and token portfolio.
            </p>
            <div className="flex justify-center">
              <WalletMultiButton className="!bg-indigo-600 !hover:bg-indigo-700 !text-white font-semibold" />
            </div>
          </div>
        )}
      </div>
      
    );
};

export default PortfolioPage;