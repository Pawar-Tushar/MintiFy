import React, { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    getMint,
} from '@solana/spl-token';
import { toast } from 'react-toastify';
import SolanaExplorerLink from '../components/SolanaExplorerLink';

interface ErrorWithLogs extends Error {
    logs?: unknown[];
}

const TokenMinter: React.FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const [mintAddress, setMintAddress] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastTxSig, setLastTxSig] = useState<string | null>(null);
    const [mintedAmountDisplay, setMintedAmountDisplay] = useState<string | null>(null);

    const handleMintTokens = useCallback(async () => {
        if (!publicKey || !connection) {
            toast.error('Wallet not connected or connection error!');
            return;
        }
        if (!mintAddress || !amount) {
            toast.error('Please enter Token Mint Address and Amount.');
            return;
        }

        setIsLoading(true);
        setLastTxSig(null);
        setMintedAmountDisplay(null);
        let signature: string | null = null;
        const currentAmountInput = amount;

        try {
            const mintPublicKey = new PublicKey(mintAddress);
            const parsedAmount = parseFloat(currentAmountInput);

            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                toast.error('Invalid amount entered.');
                setIsLoading(false);
                return;
            }

            let mintInfo;
            try {
                // console.log(`Fetching mint info for: ${mintPublicKey.toBase58()}`);
                mintInfo = await getMint(connection, mintPublicKey);
                // console.log(`Mint Decimals: ${mintInfo.decimals}`);
            } catch (err) {
                // console.error("Failed to get mint info:", err);
                toast.error("Failed to fetch token details. Is the Mint Address correct?");
                setIsLoading(false);
                return;
            }

            const amountInBaseUnits = BigInt(Math.floor(parsedAmount * Math.pow(10, mintInfo.decimals)));
            // console.log(`Amount in base units: ${amountInBaseUnits}`);

            // console.log(`Calculating ATA address for owner ${publicKey.toBase58()} and mint ${mintPublicKey.toBase58()}`);
            const associatedTokenAccountAddress = await getAssociatedTokenAddress(
                mintPublicKey,
                publicKey,
                false,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            );
            // console.log(`Calculated ATA address: ${associatedTokenAccountAddress.toBase58()}`);

            let accountInfo;
            try {
                // console.log(`Checking if ATA account exists at: ${associatedTokenAccountAddress.toBase58()}`);
                accountInfo = await connection.getAccountInfo(associatedTokenAccountAddress, 'confirmed');
                // console.log("Account check complete. Found:", !!accountInfo);
            } catch (rpcError) {
                // console.error(`RPC error checking account info for ${associatedTokenAccountAddress.toBase58()}:`, rpcError);
                toast.error("Network error while checking token account existence. Please try again.", { autoClose: 6000 });
                setIsLoading(false);
                return;
            }

            const transaction = new Transaction();
            const instructions: TransactionInstruction[] = [];

            if (!accountInfo) {
                console.log("ATA does not exist. Adding create instruction...");
                instructions.push(
                    createAssociatedTokenAccountInstruction(
                        publicKey,
                        associatedTokenAccountAddress,
                        publicKey,
                        mintPublicKey,
                        TOKEN_PROGRAM_ID,
                        ASSOCIATED_TOKEN_PROGRAM_ID
                    )
                );
            } else {
                // console.log("ATA already exists.");
            }

            // console.log(`Adding mint instruction to ATA ${associatedTokenAccountAddress.toBase58()}`);
            instructions.push(
                createMintToInstruction(
                    mintPublicKey,
                    associatedTokenAccountAddress,
                    publicKey,
                    amountInBaseUnits,
                    [],
                    TOKEN_PROGRAM_ID
                )
            );

            transaction.add(...instructions);

            // console.log(`Sending transaction with ${instructions.length} instruction(s)...`);
            signature = await sendTransaction(transaction, connection, {
                skipPreflight: false,
            });
            // console.log('Transaction sent. Signature:', signature);

            // console.log('Confirming transaction...');
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
            await connection.confirmTransaction({
                blockhash,
                lastValidBlockHeight,
                signature,
            }, 'confirmed');

            console.log('Transaction confirmed!');
            setLastTxSig(signature);
            setMintedAmountDisplay(currentAmountInput);
            toast.success(`${currentAmountInput} tokens minted!`);
        } catch (error: unknown) {
            console.error('Minting transaction failed:', error);
            let errorMessage = "Minting failed.";
            if (error instanceof Error) {
                errorMessage = `Minting failed: ${error.message}`;
                if (
                    error.message.toLowerCase().includes("mint authority mismatch") ||
                    error.message.includes("owner does not match") ||
                    error.message.includes("Missing signature for instruction") ||
                    error.message.includes("authority")
                ) {
                    errorMessage = "Mint authority invalid or mismatch. Ensure you are the Mint Authority for this token and the correct wallet is connected.";
                } else if (
                    error.message.includes("insufficient funds") ||
                    error.message.includes("insufficient lamports")
                ) {
                    errorMessage = "Insufficient SOL balance for transaction fees or account creation rent.";
                } else if (
                    error.message.includes("Invalid mint") ||
                    error.message.includes("Could not find mint")
                ) {
                    errorMessage = "Invalid Token Mint address. Please double-check.";
                } else {
                    const errorWithLogs = error as ErrorWithLogs;
                    if (errorWithLogs.logs && Array.isArray(errorWithLogs.logs)) {
                        const logMessages = errorWithLogs.logs.join('\n');
                        if (logMessages.includes("incorrect program id for instruction")) {
                            errorMessage = "Program ID mismatch during instruction processing. (Developer Error?)";
                        } else {
                            errorMessage += ` Logs: ${logMessages.substring(0, 150)}${logMessages.length > 150 ? '...' : ''}`;
                        }
                    } else if (error.message.includes("blockhash")) {
                        errorMessage += ". Network congestion or blockhash issue. Please try again.";
                    }
                }
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            toast.error(errorMessage, { autoClose: 8000 });
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, connection, sendTransaction, mintAddress, amount]);

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
  <h3 className="text-xl font-semibold mb-4 text-gray-800">2. Mint Tokens</h3>
  <p className="text-sm text-gray-600 mb-4">
    Increase the supply of an existing SPL token. You must be the designated "Mint Authority" for the token.
    Minted tokens will go to your wallet's associated account for this token ({network}).
  </p>
  <div className="mb-4">
    <label htmlFor="mintAddress" className="block text-sm font-medium text-gray-700 mb-1">
      Token Mint Address:
    </label>
    <input
      id="mintAddress"
      type="text"
      placeholder="Enter address of token to mint (e.g., K7xY...)"
      value={mintAddress}
      onChange={(e) => setMintAddress(e.target.value.trim())}
      disabled={isLoading}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-200"
    />
  </div>

  <div className="mb-4">
    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
      Amount to Mint:
    </label>
    <input
      id="amount"
      type="number"
      placeholder="e.g., 1000"
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
      min="0"
      step="any"
      disabled={isLoading}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-200"
    />
  </div>

  <button
    onClick={handleMintTokens}
    disabled={!publicKey || !mintAddress || !amount || isLoading}
    className={`w-full px-4 py-2 text-white font-semibold rounded-md transition-colors duration-200 ease-in-out ${
      isLoading || !publicKey || !mintAddress || !amount
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
    }`}
  >
    {isLoading ? (
      <div className="flex justify-center items-center">
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Minting...
      </div>
    ) : (
      'Mint Tokens'
    )}
  </button>

  {lastTxSig && mintedAmountDisplay && (
    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-300 shadow-sm">
      <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
        <svg
          className="w-6 h-6 mr-2 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Minting Successful!
      </h4>

      <p className="text-sm text-gray-700 mb-3">
        Successfully minted{' '}
        <span className="font-semibold text-gray-800">{mintedAmountDisplay}</span>{' '}
        tokens{' '}
        <span className="text-xs">(Mint: {mintAddress ? `${mintAddress.substring(0, 4)}...${mintAddress.substring(mintAddress.length - 4)}` : ''})</span>.
        They have been added to your associated token account.
      </p>

      <div className="pt-3 border-t border-green-200">
        <p className="text-sm font-medium text-gray-700 mb-2">View Transaction:</p>
        <div className="text-sm">
          <SolanaExplorerLink type="tx" value={lastTxSig} network={network} />
        </div>
      </div>
    </div>
  )}
</div>

    );
};

export default TokenMinter;
