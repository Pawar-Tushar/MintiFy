import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getMint, Account as TokenAccountInfo, unpackAccount } from '@solana/spl-token'; 
import { toast } from 'react-toastify';
import SolanaExplorerLink from './SolanaExplorerLink'; 
import { FaCopy, FaCheck } from 'react-icons/fa'; 

interface TokenBalance {
    mintAddress: string;
    balance: string; 
    decimals: number;
    uiAmount: number; 
    tokenAccountAddress: string; 
}

function formatTokenBalance(rawAmount: bigint, decimals: number): string {
    if (decimals === 0) {
        return rawAmount.toString();
    }
    const divisor = BigInt(10 ** decimals);
    const integerPart = rawAmount / divisor;
    const fractionalPart = rawAmount % divisor;

    if (fractionalPart === 0n) {
        return integerPart.toString();
    }

    const fractionalString = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalString.replace(/0+$/, '');
    return `${integerPart}.${trimmedFractional}`;
}


const AccountDetails: React.FC = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();

    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
    const [isLoadingSol, setIsLoadingSol] = useState<boolean>(false);
    const [isLoadingTokens, setIsLoadingTokens] = useState<boolean>(false);
    const [errorSol, setErrorSol] = useState<string | null>(null);
    const [errorTokens, setErrorTokens] = useState<string | null>(null);
    const [network, setNetwork] = useState<string>('unknown');
    const [copied, setCopied] = useState<boolean>(false);

    useEffect(() => {
        if (connection) {
            const endpoint = connection.rpcEndpoint;
            if (endpoint.includes('devnet')) setNetwork('Devnet');
            else if (endpoint.includes('testnet')) setNetwork('Testnet');
            else if (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')) setNetwork('Localnet');
            else setNetwork('Mainnet'); 
        }
    }, [connection]);

    const fetchSolBalance = useCallback(async () => {
        if (!publicKey || !connection) return;
        setIsLoadingSol(true);
        setErrorSol(null);
        try {
            const balance = await connection.getBalance(publicKey);
            setSolBalance(balance / LAMPORTS_PER_SOL);
        } catch (err: any) {
            console.error("Failed to fetch SOL balance:", err);
            setErrorSol(`Failed to fetch SOL balance: ${err.message}`);
            setSolBalance(null);
        } finally {
            setIsLoadingSol(false);
        }
    }, [publicKey, connection]);

    const fetchTokenBalances = useCallback(async () => {
        if (!publicKey || !connection) return;
        setIsLoadingTokens(true);
        setErrorTokens(null);
        setTokenBalances([]); 

        try {
            const tokenAccounts = await connection.getTokenAccountsByOwner(
                publicKey,
                { programId: TOKEN_PROGRAM_ID }
            );

            if (!tokenAccounts || tokenAccounts.value.length === 0) {
                 console.log("No token accounts found.");
                setIsLoadingTokens(false);
                 return;
             }

            console.log(`Found ${tokenAccounts.value.length} token accounts. Fetching details...`);

            const balances: TokenBalance[] = [];
            let fetchErrors = 0;

            for (const { pubkey: tokenAccountPubkey, account } of tokenAccounts.value) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 50)); 

                    const accountInfo = unpackAccount(tokenAccountPubkey, account, TOKEN_PROGRAM_ID);

                    if (accountInfo.amount === 0n) {
                        console.log(`Skipping zero balance account for mint: ${accountInfo.mint.toBase58()}`);
                        continue;
                    }

                    console.log(`Fetching mint info for: ${accountInfo.mint.toBase58()}`);
                    const mintInfo = await getMint(connection, accountInfo.mint);

                    const uiAmount = Number(accountInfo.amount) / (10 ** mintInfo.decimals);

                    balances.push({
                        mintAddress: accountInfo.mint.toBase58(),
                        decimals: mintInfo.decimals,
                        balance: formatTokenBalance(accountInfo.amount, mintInfo.decimals),
                        uiAmount: uiAmount,
                        tokenAccountAddress: tokenAccountPubkey.toBase58(),
                    });

                } catch (mintError: any) {
                    fetchErrors++;
                     console.error(`Failed to get mint info or process account ${tokenAccountPubkey.toBase58()}:`, mintError);
                    if (mintError instanceof Error && (mintError.message.includes('429') || mintError.code === 429)) {
                         toast.warning("Rate limit hit fetching token details. List may be incomplete.", { autoClose: 5000 });
                         setErrorTokens("Rate limit hit fetching token details. List may be incomplete.");
                    }
                }
            }

            balances.sort((a, b) => b.uiAmount - a.uiAmount);

            setTokenBalances(balances);

             if (fetchErrors > 0 && !errorTokens) { 
                 setErrorTokens(`Could not fetch details for ${fetchErrors} token(s).`);
            }


        } catch (err: any) {
             console.error("Failed to fetch token accounts:", err);
             setErrorTokens(`Failed to fetch token accounts: ${err.message}`);
             setTokenBalances([]);
             if (err instanceof Error && (err.message.includes('429') || err.code === 429)) {
                 setErrorTokens("Rate limit exceeded fetching token accounts. Please try again shortly.");
            }
        } finally {
            setIsLoadingTokens(false);
        }
    }, [publicKey, connection]);

    useEffect(() => {
        fetchSolBalance();
        fetchTokenBalances();
    }, [fetchSolBalance, fetchTokenBalances]); 

    const handleCopyAddress = () => {
        if (publicKey) {
            navigator.clipboard.writeText(publicKey.toBase58())
                .then(() => {
                    setCopied(true);
                    toast.success("Address copied to clipboard!");
                    setTimeout(() => setCopied(false), 2000); 
                })
                .catch(err => {
                    console.error('Failed to copy address: ', err);
                    toast.error("Failed to copy address.");
                });
        }
    };

    const renderLoading = (text: string = "Loading...") => (
        <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {text}
        </div>
    );
    const renderError = (errorMsg: string | null) => errorMsg ? <span className="text-xs text-red-500 dark:text-red-400 ml-2">{errorMsg}</span> : null;

    if (!publicKey) {
        return <div className="text-center p-4">Wallet not connected.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Account Info</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Address:</span>
                         <div className="flex items-center space-x-2 text-gray-800 dark:text-gray-200">
                             <code className="text-xs md:text-sm break-all">{publicKey.toBase58()}</code>
                             <button onClick={handleCopyAddress} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none" title="Copy Address">
                                 {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
                            </button>
                         </div>
                    </div>
                    <div className="flex items-center justify-between">
                         <span className="font-medium text-gray-600 dark:text-gray-400">Network:</span>
                         <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                             network === 'Mainnet' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                             network === 'Devnet' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                             network === 'Testnet' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                             'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                         }`}>
                            {network}
                         </span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-400">SOL Balance:</span>
                         {isLoadingSol && renderLoading("Fetching SOL...")}
                         {!isLoadingSol && solBalance !== null && (
                             <span className="font-semibold text-gray-800 dark:text-gray-200">
                                 {solBalance.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} SOL
                             </span>
                         )}
                         {!isLoadingSol && errorSol && renderError(errorSol)}
                         {!isLoadingSol && solBalance === null && !errorSol && <span>N/A</span>}
                     </div>
                 </div>
            </div>

             <div className="p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                 <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Token Holdings</h3>
                {isLoadingTokens && renderLoading("Loading tokens...")}
                 {!isLoadingTokens && errorTokens && (
                    <div className="text-center p-4 text-red-600 dark:text-red-400 text-sm">
                         {errorTokens}
                    </div>
                )}
                {!isLoadingTokens && tokenBalances.length === 0 && !errorTokens && (
                     <div className="text-center p-4 text-gray-500 dark:text-gray-400 text-sm">
                        No SPL tokens found in this wallet (with non-zero balance).
                     </div>
                )}
                 {!isLoadingTokens && tokenBalances.length > 0 && (
                     <div className="overflow-x-auto">
                         <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                             <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                                         Token (Mint Address)
                                     </th>
                                     <th scope="col" className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                                         Balance
                                     </th>
                                     {/* Optional: Add Decimals column */}
                                     {/* <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dec</th> */}
                                 </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {tokenBalances.map((token) => (
                                    <tr key={token.mintAddress}>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                             <SolanaExplorerLink
                                                type="address"
                                                value={token.mintAddress}
                                                network={network.toLowerCase().replace(' ', '-')} // Format network name for explorer link
                                                label={`${token.mintAddress.substring(0, 6)}...${token.mintAddress.substring(token.mintAddress.length - 6)}`}
                                                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300" // Example styling
                                             />
                                        </td>
                                         <td className="px-4 py-3 whitespace-nowrap text-right text-gray-800 dark:text-gray-200 font-medium">
                                            {token.balance}
                                         </td>
                                        
                                        {/* <td className="px-3 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{token.decimals}</td> */}
                                    </tr>
                                ))}
                            </tbody>
                         </table>
                     </div>
                )}
             </div>
        </div> 
     );
};

export default AccountDetails;