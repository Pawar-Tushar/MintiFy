import React, { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    getMint,
    getAccount,
    TokenAccountNotFoundError,
} from '@solana/spl-token';
import { toast } from 'react-toastify';
import SolanaExplorerLink from '../components/SolanaExplorerLink';

interface ErrorWithLogs extends Error {
    logs?: unknown[];
}

const TokenSender: React.FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const [mintAddress, setMintAddress] = useState<string>('');
    const [recipientAddress, setRecipientAddress] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastTxSig, setLastTxSig] = useState<string | null>(null);

    const handleSendTokens = useCallback(async () => {
        if (!publicKey || !connection) {
            toast.error('Wallet not connected or connection error!');
            return;
        }
        if (!mintAddress || !recipientAddress || !amount) {
            toast.error('Please fill in all fields: Token Mint, Recipient Address, and Amount.');
            return;
        }

        setIsLoading(true);
        setLastTxSig(null);
        let signature: string | null = null;

        try {
            const mintPublicKey = new PublicKey(mintAddress);
            const recipientPublicKey = new PublicKey(recipientAddress);
            const parsedAmount = parseFloat(amount);

            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                toast.error('Invalid amount entered.');
                setIsLoading(false);
                return;
            }
            if (recipientPublicKey.equals(publicKey)) {
                toast.error("Cannot send tokens to yourself.");
                setIsLoading(false);
                return;
            }

            let mintInfo;
            try {
                console.log(`Fetching mint info for: ${mintPublicKey.toBase58()}`);
                mintInfo = await getMint(connection, mintPublicKey);
                console.log(`Mint Decimals: ${mintInfo.decimals}`);
            } catch (err) {
                console.error("Failed to get mint info:", err);
                toast.error("Failed to fetch token details. Is the Mint Address correct?");
                setIsLoading(false);
                return;
            }

            const amountInBaseUnits = BigInt(parsedAmount * Math.pow(10, mintInfo.decimals));

            console.log(`Getting sender's ATA for owner ${publicKey.toBase58()} and mint ${mintPublicKey.toBase58()}`);
            const senderAtaAddress = await getAssociatedTokenAddress(mintPublicKey, publicKey);
            console.log(`Sender ATA: ${senderAtaAddress.toBase58()}`);

            let senderAccountInfo;
            try {
                console.log("Checking sender's token account balance...");
                senderAccountInfo = await getAccount(connection, senderAtaAddress, 'confirmed');
                console.log(`Sender balance raw: ${senderAccountInfo.amount}`);
                if (senderAccountInfo.amount < amountInBaseUnits) {
                    toast.error(`Insufficient token balance. You have ${Number(senderAccountInfo.amount) / Math.pow(10, mintInfo.decimals)} tokens.`);
                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                console.error("Error checking sender's token account:", error);
                if (error instanceof TokenAccountNotFoundError) {
                    toast.error("You do not have an account for this token. Mint or receive some first.");
                } else if (error instanceof Error) {
                    toast.error(`Error checking your token balance: ${error.message}`);
                }
                setIsLoading(false);
                return;
            }

            console.log(`Calculating recipient's ATA address for owner ${recipientPublicKey.toBase58()} and mint ${mintPublicKey.toBase58()}`);
            const recipientAtaAddress = await getAssociatedTokenAddress(mintPublicKey, recipientPublicKey);
            console.log(`Recipient ATA: ${recipientAtaAddress.toBase58()}`);

            let recipientAccountInfo;
            try {
                console.log(`Checking if recipient's ATA (${recipientAtaAddress.toBase58()}) exists...`);
                recipientAccountInfo = await connection.getAccountInfo(recipientAtaAddress, 'confirmed');
                console.log("Recipient account check complete. Found:", !!recipientAccountInfo);
            } catch (rpcError) {
                console.error(`RPC error checking recipient's account info:`, rpcError);
                toast.error("Network error checking recipient's token account. Please try again.", { autoClose: 6000 });
                setIsLoading(false);
                return;
            }

            const transaction = new Transaction();
            const instructions: TransactionInstruction[] = [];

            if (!recipientAccountInfo) {
                console.log("Recipient ATA does not exist. Adding create instruction...");
                instructions.push(
                    createAssociatedTokenAccountInstruction(
                        publicKey,
                        recipientAtaAddress,
                        recipientPublicKey,
                        mintPublicKey,
                        TOKEN_PROGRAM_ID,
                        ASSOCIATED_TOKEN_PROGRAM_ID
                    )
                );
            } else {
                console.log("Recipient ATA already exists.");
            }

            console.log(`Adding transfer instruction from ${senderAtaAddress.toBase58()} to ${recipientAtaAddress.toBase58()}`);
            instructions.push(
                createTransferInstruction(
                    senderAtaAddress,
                    recipientAtaAddress,
                    publicKey,
                    amountInBaseUnits,
                    [],
                    TOKEN_PROGRAM_ID
                )
            );

            transaction.add(...instructions);

            console.log(`Sending transaction with ${instructions.length} instruction(s)...`);
            signature = await sendTransaction(transaction, connection, {
                skipPreflight: false
            });
            console.log('Transaction sent. Signature:', signature);

            console.log('Confirming transaction...');
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash,
                lastValidBlockHeight,
                signature
            }, 'confirmed');

            console.log('Transaction confirmed!');
            setLastTxSig(signature);
            toast.success(
                <div>
                    {amount} tokens sent successfully to{' '}
                    <code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded">
                        {recipientPublicKey.toBase58()}
                    </code>!
                </div>,
                { autoClose: 7000 }
            );
        } catch (error: unknown) {
            console.error('Sending failed:', error);
            let errorMessage = "Token sending failed.";
            if (error instanceof Error) {
                errorMessage = `Sending failed: ${error.message}`;
                if (error instanceof TokenAccountNotFoundError) {
                    errorMessage = "Account creation/finding failed unexpectedly. Check SOL balance & try again.";
                } else if (error.message.includes("invalid account owner")) {
                    errorMessage = "Account ownership error. Check addresses.";
                } else if (error.message.includes("insufficient lamports")) {
                    errorMessage = "Insufficient SOL balance for transaction fees or account rent.";
                } else if (error.message.includes("Invalid instruction: insufficient funds")) {
                    errorMessage = "Insufficient token balance for the transfer.";
                } else {
                    const errorWithLogs = error as ErrorWithLogs;
                    if (errorWithLogs.logs && Array.isArray(errorWithLogs.logs)) {
                        errorMessage += ` Details: ${JSON.stringify(errorWithLogs.logs)}`;
                    }
                }
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            toast.error(errorMessage, { autoClose: 7000 });
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, connection, sendTransaction, mintAddress, recipientAddress, amount]);

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md my-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">3. Send Tokens</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Transfer SPL tokens from your wallet to another Solana address. This may create a token account for the recipient if they don't have one (requires SOL for rent paid by you).
            </p>
            <div className="mb-4">
                <label htmlFor="send_mintAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Token Mint Address to Send:
                </label>
                <input
                    id="send_mintAddress"
                    type="text"
                    placeholder="e.g., K7xY..."
                    value={mintAddress}
                    onChange={(e) => setMintAddress(e.target.value.trim())}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600"
                />
            </div>

            <div className="mb-4">
                <label htmlFor="recipientAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recipient Wallet Address:
                </label>
                <input
                    id="recipientAddress"
                    type="text"
                    placeholder="Enter recipient's Solana address (e.g., BxR9...)"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value.trim())}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600"
                />
            </div>

            <div className="mb-4">
                <label htmlFor="send_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount to Send:
                </label>
                <input
                    id="send_amount"
                    type="number"
                    placeholder="e.g., 5.5"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="any"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600"
                />
            </div>

            <button
                onClick={handleSendTokens}
                disabled={!publicKey || !mintAddress || !recipientAddress || !amount || isLoading}
                className={`w-full px-4 py-2 text-white font-semibold rounded-md transition-colors duration-200 ease-in-out ${
                    isLoading || !publicKey || !mintAddress || !recipientAddress || !amount
                        ? 'bg-gray-400 cursor-not-allowed dark:bg-gray-600'
                        : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
            >
                {isLoading ? (
                    <div className="flex justify-center items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /* ... */></svg>
                        Sending...
                    </div>
                ) : 'Send Tokens'}
            </button>

            {lastTxSig && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 rounded border border-green-200 dark:border-green-700">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Send Successful! Transaction:</p>
                    <div className="mt-1">
                        <SolanaExplorerLink
                            type="tx"
                            value={lastTxSig}
                            network={
                                connection.rpcEndpoint.includes('devnet')
                                    ? 'devnet'
                                    : connection.rpcEndpoint.includes('testnet')
                                    ? 'testnet'
                                    : 'mainnet-beta'
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TokenSender;
