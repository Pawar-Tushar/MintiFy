import React, { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
    Keypair,
    SystemProgram,
    Transaction,
} from '@solana/web3.js';
import {
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
} from '@solana/spl-token';
import { toast } from 'react-toastify';
import SolanaExplorerLink from '../components/SolanaExplorerLink';

const TokenCreator: React.FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const [decimalsInput, setDecimalsInput] = useState<string>('9');
    const [isLoading, setIsLoading] = useState(false);
    const [lastMintAddress, setLastMintAddress] = useState<string | null>(null);
    const [lastTxSig, setLastTxSig] = useState<string | null>(null);

    const handleCreateToken = useCallback(async () => {
        if (!publicKey || !connection) {
            toast.error("Wallet not connected or connection issue.");
            return;
        }

        const decimals = parseInt(decimalsInput, 10);
        if (isNaN(decimals) || decimals < 0 || decimals > 18) {
            toast.error("Decimals must be a number between 0 and 18.");
            return;
        }

        setIsLoading(true);
        setLastMintAddress(null);
        setLastTxSig(null);
        const mintKeypair = Keypair.generate();
        console.log(`New Mint Public Key: ${mintKeypair.publicKey.toBase58()}`);

        try {
            const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: MINT_SIZE,
                    lamports,
                    programId: TOKEN_PROGRAM_ID,
                }),
                createInitializeMintInstruction(
                    mintKeypair.publicKey,
                    decimals,
                    publicKey,
                    publicKey, 
                    TOKEN_PROGRAM_ID
                )
            );

            const signature = await sendTransaction(transaction, connection, {
                signers: [mintKeypair],
            });
            console.log("Transaction Signature:", signature);

            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash,
                lastValidBlockHeight,
                signature
            }, 'confirmed'); 
            console.log("Transaction Confirmed:", signature);

            setLastMintAddress(mintKeypair.publicKey.toBase58());
            setLastTxSig(signature);
            toast.success( 
                `Token creation initiated! Mint: ${mintKeypair.publicKey.toBase58().substring(0, 8)}...`
            );

        } catch (error: unknown) {
            console.error("Token creation failed:", error);
            let errorMessage = "Token creation failed.";
            if (error instanceof Error) {
                errorMessage = `Token creation failed: ${error.message}`;
                if (error.message.includes("insufficient lamports")) {
                    errorMessage = "Insufficient SOL balance for rent/fees.";
                } else if ("logs" in error && Array.isArray((error as any).logs)) { 
                    errorMessage += ` Details: ${JSON.stringify((error as any).logs)}`;
                } else if (error.message.includes("blockhash")) {
                    errorMessage += ". Please try again or refresh the page.";
                }
            } else if (typeof error === 'string') {
                errorMessage = error; 
            }
            toast.error(errorMessage, { autoClose: 7000 }); 
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, connection, sendTransaction, decimalsInput]);

    const getNetwork = () => {
        if (!connection) return 'mainnet-beta'; 
        const endpoint = connection.rpcEndpoint;
        if (endpoint.includes('devnet')) return 'devnet';
        if (endpoint.includes('testnet')) return 'testnet';
        return 'mainnet-beta';
    };
    const network = getNetwork();

    return (
        <div className="p-6 bg-white rounded-lg shadow-md my-6 border border-gray-200">
  <h3 className="text-xl font-semibold mb-4 text-gray-800">1. Create New SPL Token</h3>
  <p className="text-sm text-gray-600 mb-4">
    This action will create a new, unique token mint account on the Solana {network} network. You will need SOL for transaction fees and rent.
  </p>
  <div className="mb-4">
    <label htmlFor="decimals" className="block text-sm font-medium text-gray-700 mb-1">
      Token Decimals (0-18):
    </label>
    <input
      id="decimals"
      type="number"
      value={decimalsInput}
      onChange={(e) => setDecimalsInput(e.target.value)}
      min="0"
      max="18"
      step="1"
      placeholder="e.g., 9"
      disabled={isLoading}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
    />
  </div>

  <button
    onClick={handleCreateToken}
    disabled={!publicKey || !connection || isLoading}
    className={`w-full px-4 py-2 text-white font-semibold rounded-md transition-colors duration-200 ease-in-out ${
      isLoading || !publicKey || !connection
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
    }`}
  >
    {isLoading ? (
      <div className="flex justify-center items-center">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Creating...
      </div>
    ) : 'Create Token'}
  </button>

  {lastMintAddress && lastTxSig && (
    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-300 shadow-sm">
      <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
        <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Token Created Successfully!
      </h4>

      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700 mb-1">
          New Token Mint Address:
        </p>
        <code className="block break-all bg-gray-100 p-2 rounded text-xs text-gray-800 shadow-sm font-mono">
          {lastMintAddress}
        </code>
      </div>

      <div className="pt-3 border-t border-green-200">
        <p className="text-sm font-medium text-gray-700 mb-2">
          View on Solana Explorer:
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-sm">
          <SolanaExplorerLink
            type="tx"
            value={lastTxSig}
            network={network}
          />
        
          <SolanaExplorerLink
            type="address"
            value={lastMintAddress}
            network={network}
            label="View Mint Address" 
          />
        </div>
      </div>
    </div>
  )}
</div>

    );
};

export default TokenCreator;
