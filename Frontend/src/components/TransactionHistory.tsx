import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
    PublicKey,
    ParsedTransactionWithMeta,
    ParsedInstruction,
    ConfirmedSignatureInfo 
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import SolanaExplorerLink from './SolanaExplorerLink'; 
import { toast } from 'react-toastify';

interface SimpleTransaction {
    signature: string;
    blockTime: number | null | undefined;
    status: string;
    type: string;
    details: string;
}

type ExplorerNetwork = 'devnet' | 'testnet' | 'mainnet-beta';

const ITEMS_PER_PAGE = 5;
const FETCH_DELAY_MS = 250;

const TransactionHistory: React.FC = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();

    const [transactions, setTransactions] = useState<SimpleTransaction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
    const [pageSignatures, setPageSignatures] = useState<(string | undefined)[]>([undefined]);
    const [canGoNext, setCanGoNext] = useState<boolean>(true);

    const parseSplTokenInstruction = useCallback((ix: ParsedInstruction, userPublicKey: PublicKey): { type: string, details: string } | null => {
        if (!('parsed' in ix) || typeof ix.parsed !== 'object' || ix.parsed === null) {
            return null;
        }
        const info = ix.parsed.info;
        const type = ix.parsed.type;
        const userKeyString = userPublicKey.toBase58();
        let details = "";
        let simpleType = "Unknown SPL";
        let involvesUser = false;

        try {
            switch (type) {
                case 'mintTo':
                case 'mintToChecked':
                    simpleType = "Mint";
                    const mintAmount = info.tokenAmount?.uiAmountString ?? info.amount ?? 'N/A';
                    const mintDestination = info.account;
                    const mintAuth = info.mintAuthority;
                    if (mintDestination === userKeyString || mintAuth === userKeyString) {
                        involvesUser = true;
                        const toPart = mintDestination === userKeyString ? 'You' : `${mintDestination.substring(0,4)}...`;
                        details = `Minted ${mintAmount} tokens To: ${toPart}`;
                        if (mintAuth === userKeyString) details += " (As Authority)";
                    }
                    break;
                case 'transfer':
                case 'transferChecked':
                    simpleType = "Token Transfer";
                    const transferAmount = info.tokenAmount?.uiAmountString ?? info.amount ?? 'N/A';
                    const source = info.source;
                    const destination = info.destination;
                
                    // const authority = info.authority;
                    if (source === userKeyString || destination === userKeyString) {
                        involvesUser = true;
                        const sourcePart = source === userKeyString ? 'You' : `${source?.substring(0, 4)}...`;
                        const destPart = destination === userKeyString ? 'You' : `${destination?.substring(0, 4)}...`;
                        details = `${sourcePart === 'You' ? 'Sent' : 'Received'} ${transferAmount} tokens ${sourcePart === 'You' ? 'To' : 'From'} ${sourcePart === 'You' ? destPart : sourcePart}`;
                    }
                    break;
                case 'createAssociatedTokenAccount':
                case 'initializeAccount':
                case 'initializeAccount2':
                case 'initializeAccount3':
                    simpleType = "Create Token Acc";
                    if (info.owner === userKeyString || info.payer === userKeyString || info.wallet === userKeyString) {
                        involvesUser = true;
                        const ataAccount = info.account ? `${info.account.substring(0,4)}...${info.account.substring(info.account.length - 4)}` : 'Unknown Account';
                        const ataMint = info.mint ? `${info.mint.substring(0,4)}...` : 'Unknown Mint';
                        details = `Created token account ${ataAccount} for Mint ${ataMint}`;
                        if (info.owner === userKeyString) details += " (Owned by You)";
                    }
                    break;
                case 'approve':
                case 'approveChecked':
                    simpleType = "Approval";
                    if (info.owner === userKeyString) {
                        involvesUser = true;
                        const approveAmount = info.tokenAmount?.uiAmountString ?? info.amount ?? 'N/A';
                        details = `Approved ${info.delegate?.substring(0,4)}... for ${approveAmount} tokens (Your account)`;
                    }
                    break;
                default:
                    return null; 
            }
        } catch (parseError) {
            console.error("Error parsing SPL instruction info:", parseError, ix);
            return null;
        }
        return involvesUser ? { type: simpleType, details } : null;
    }, []);

    const processTransaction = useCallback((tx: ParsedTransactionWithMeta | null, signature: string, userPublicKey: PublicKey): SimpleTransaction | null => {
        if (!tx || !tx.meta) {
             return {
                 signature: signature,
                 blockTime: tx?.blockTime,
                 status: tx?.meta?.err ? 'Failed (Meta Error)' : (tx ? 'Success (Processing Error)' : 'Missing Data'),
                 type: "Processing Error",
                 details: tx ? "Could not process transaction." : "Missing transaction data.",
             };
        }

        let primaryType = "Unknown";
        let primaryDetails = "Could not determine primary action.";
        let status = tx.meta.err ? 'Failed' : 'Success';
        const userKeyString = userPublicKey.toBase58();
        let bestParsedInstruction : { type: string, details: string } | null = null;
        let solTransferDetails : string | null = null;

         const accountKeys = tx.transaction.message.accountKeys.map(acc => acc.pubkey.toBase58());
         const userKeyIndex = accountKeys.indexOf(userKeyString);
         if(userKeyIndex !== -1 && tx.meta?.preBalances && tx.meta?.postBalances) {
            const preBalance = tx.meta.preBalances[userKeyIndex];
            const postBalance = tx.meta.postBalances[userKeyIndex];
             if (preBalance != null && postBalance != null && preBalance !== postBalance) {
                 const changeSOL = (postBalance - preBalance) / 1e9; 
                 if (Math.abs(changeSOL) > 1e-9) { 
                     solTransferDetails = `${changeSOL > 0 ? 'Received' : 'Sent'} ${Math.abs(changeSOL).toFixed(6)} SOL`;
                 }
             }
         }

        if (tx.transaction.message.instructions) {
            for (const ix of tx.transaction.message.instructions) {
                let currentParsed : { type: string, details: string } | null = null;
                if ('programId' in ix && ix.programId.equals(TOKEN_PROGRAM_ID) && 'parsed' in ix) {
                     currentParsed = parseSplTokenInstruction(ix as ParsedInstruction, userPublicKey);
                }
                 else if ('programId' in ix && ix.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID) && 'parsed' in ix && ix.parsed?.type === 'create') {
                     if (ix.parsed.info?.payer === userKeyString || ix.parsed.info?.wallet === userKeyString) {
                         currentParsed = { type: "Create ATA", details: `Created Associated Token Account ${ix.parsed.info?.account?.substring(0,4) ?? ''}...` };
                     }
                 }
                if (currentParsed) {
                     if (!bestParsedInstruction || (currentParsed.type.includes("Transfer") || currentParsed.type.includes("Mint")) || (!(bestParsedInstruction.type.includes("Transfer") || bestParsedInstruction.type.includes("Mint")) && currentParsed.type !== 'Create ATA' && currentParsed.type !== 'Approval')) {
                           bestParsedInstruction = currentParsed;
                     }
                   }
            }
        }
       if (bestParsedInstruction && (bestParsedInstruction.type.includes("Transfer") || bestParsedInstruction.type.includes("Mint"))) {
           primaryType = bestParsedInstruction.type;
           primaryDetails = bestParsedInstruction.details;
       } else if (solTransferDetails) {
           primaryType = "SOL Transfer";
           primaryDetails = solTransferDetails;
        } else if (bestParsedInstruction) {
           primaryType = bestParsedInstruction.type;
           primaryDetails = bestParsedInstruction.details;
       } else {
            const programsInvoked = [...new Set(
                 tx.transaction.message.instructions
                    .map(ix => ('programId' in ix ? ix.programId.toBase58() : null))
                    .filter((id): id is string => !!id && id !== '11111111111111111111111111111111' && !id.startsWith('Token') && !id.startsWith('Assoc') && !id.startsWith('Sys'))
             )];
              if (programsInvoked.length > 0) {
                 primaryType = "Program Call";
                 primaryDetails = `Interacted with: ${programsInvoked.map((p: string) => p.substring(0, 4)+'...').join(', ')}`;
              } else {
                 primaryType = "System/Other";
                 primaryDetails = status === 'Success' ? "Transaction confirmed" : "Transaction failed";
              }
       }

        return { signature, blockTime: tx.blockTime, status, type: primaryType, details: primaryDetails };
    }, [parseSplTokenInstruction]);


    const fetchPage = useCallback(async (targetPageIndex: number) => {
        if (!publicKey || !connection) return;

        setIsLoading(true);
        setError(null);

        const beforeSignature = pageSignatures[targetPageIndex];
        console.log(`Fetching page ${targetPageIndex + 1}, using 'before': ${beforeSignature ?? 'start'}`);

        let signaturesInfo: ConfirmedSignatureInfo[] = [];

        try {
            signaturesInfo = await connection.getSignaturesForAddress(
                 publicKey,
                { limit: ITEMS_PER_PAGE, before: beforeSignature },
                'confirmed'
            );

            if (!signaturesInfo || signaturesInfo.length === 0) {
                console.log("No more transaction signatures found.");
                setTransactions([]);
                setCanGoNext(false);
                setCurrentPageIndex(targetPageIndex);
                setIsLoading(false);
                return;
            }

            console.log(`Fetched ${signaturesInfo.length} signatures. Getting details...`);

            const processedTxs: SimpleTransaction[] = [];
             for (const sigInfo of signaturesInfo) {
                try {
                    await new Promise(resolve => setTimeout(resolve, FETCH_DELAY_MS));
                    // console.log(`Fetching details for ${sigInfo.signature.substring(0,10)}...`);
                    const tx = await connection.getParsedTransaction(
                        sigInfo.signature, { maxSupportedTransactionVersion: 0 }
                    );
                    const processed = processTransaction(tx, sigInfo.signature, publicKey);
                    if (processed) processedTxs.push(processed);
                     else { 
                          processedTxs.push({
                             signature: sigInfo.signature, blockTime: sigInfo.blockTime,
                             status: sigInfo.err ? "Failed" : "Success", type: "Processing Issue",
                             details: "Could not determine transaction details."
                         });
                     }
                 } catch (detailError: any) { 
                     console.error(`Failed to fetch details for ${sigInfo.signature}:`, detailError);
                     processedTxs.push({
                         signature: sigInfo.signature, blockTime: sigInfo.blockTime,
                         status: "Failed (Detail Fetch)", type: "Fetch Error",
                         details: `Error getting details: ${detailError?.message?.substring(0, 80) ?? 'Unknown'}`
                     });
                     const isRateLimit = detailError instanceof Error && (detailError.message.includes('429') || (detailError as any)?.code === 429 || JSON.stringify(detailError).includes('429'));
                      if (isRateLimit) {
                         toast.warning(`Rate limit hit fetching details for ${sigInfo.signature.substring(0,6)}...`, { autoClose: 4000 });
                         setError("Rate limit hit. Results incomplete. Try later/custom RPC.");
                         
                     }
                 }
             }

            setTransactions(processedTxs);
            setCurrentPageIndex(targetPageIndex);

            const fetchedFullPage = signaturesInfo.length === ITEMS_PER_PAGE;
            setCanGoNext(fetchedFullPage);

             if (fetchedFullPage) {
                const nextBeforeSignature = signaturesInfo[signaturesInfo.length - 1].signature;
                 setPageSignatures(prev => {
                     const newSigs = [...prev];
                     if (newSigs.length <= targetPageIndex + 1) newSigs.length = targetPageIndex + 2;
                     newSigs[targetPageIndex + 1] = nextBeforeSignature;
                     return newSigs;
                 });
                 console.log(`Stored 'before' for page ${targetPageIndex + 2}: ${nextBeforeSignature.substring(0,6)}...`);
            } else {
                setPageSignatures(prev => prev.slice(0, targetPageIndex + 1));
                 console.log(`Fetched < ${ITEMS_PER_PAGE} sigs, end of history.`);
             }
         } catch (err: any) {
             console.error(`Failed to fetch signature list for page ${targetPageIndex + 1}:`, err);
              const isRateLimit = err instanceof Error && (err.message.includes('429') || (err as any)?.code === 429 || JSON.stringify(err).includes('429'));
             const displayError = isRateLimit
                 ? "Rate limit exceeded fetching signatures. Try again shortly."
                 : `Failed to fetch history: ${err?.message ?? 'Unknown error'}`;

             setError(displayError);
             toast.error(isRateLimit ? "RPC Rate Limit hit." : "Error fetching transactions.");
             setCanGoNext(false);
             setTransactions([]); 
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, connection, processTransaction, pageSignatures]);

    useEffect(() => {
        if (publicKey && connection) {
             console.log("Wallet/connection active. Resetting/fetching page 1.");
            setTransactions([]);
            setCurrentPageIndex(0);
            setPageSignatures([undefined]);
             setCanGoNext(true);
            setError(null);
            setIsLoading(true);
            fetchPage(0);
        } else {
             setTransactions([]); setCurrentPageIndex(0); setPageSignatures([undefined]);
             setError(null); setIsLoading(false); setCanGoNext(false);
         }
     }, [publicKey, connection]);


    const handlePrevious = () => {
        if (currentPageIndex > 0 && !isLoading) {
            fetchPage(currentPageIndex - 1);
        }
    };
    const handleNext = () => {
         if (canGoNext && !isLoading && pageSignatures.length > currentPageIndex + 1 && pageSignatures[currentPageIndex + 1] !== undefined) {
            fetchPage(currentPageIndex + 1);
         } else if (canGoNext && !isLoading) { 
            console.warn("Next clicked but 'before' signature missing? Refetching current.");
            fetchPage(currentPageIndex);
        }
    };
     const getExplorerNetwork = (networkName: string | undefined = connection?.rpcEndpoint): ExplorerNetwork => {
         if (!networkName) return 'mainnet-beta'; 
         const endpoint = networkName.toLowerCase();
         if (endpoint.includes('devnet')) return 'devnet';
         if (endpoint.includes('testnet')) return 'testnet';
         if (endpoint.includes('mainnet-beta')) return 'mainnet-beta';
        return 'mainnet-beta'; 
    };
    const explorerNetwork = getExplorerNetwork(); 

    return (
        <div className="transaction-history-container space-y-4 p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Transaction History</h3>

             {isLoading && ( <div className="flex justify-center items-center p-6 text-gray-600 dark:text-gray-400"> <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> <span>Loading transactions...</span> </div> )}

             {!isLoading && error && ( <div className="text-center p-4 bg-red-50 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300"> <p className="font-medium">Error</p> <p className="text-sm">{error}</p> </div> )}

            {!isLoading && transactions.length > 0 && (
                 <div className="transaction-history-list space-y-3">
                     {transactions.map((tx) => (
                         <div key={tx.signature} className={`p-3 rounded-lg shadow-sm border transition-opacity duration-300 ${ tx.status.includes('Failed') || tx.type.includes('Error') ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 opacity-80' : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700' }`}>
                             <div className="flex justify-between items-start mb-1 gap-2">
                              
                                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full leading-tight whitespace-nowrap shrink-0 ${ tx.type.includes("Mint") ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : tx.type.includes("Transfer") ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : tx.type.includes("Create") ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : tx.type.includes("Program") ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' : tx.type.includes("SOL") ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : tx.type.includes("Error") ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' }`}> {tx.type} </span>
                                 
                                  <span className="text-xs text-gray-500 dark:text-gray-400 text-right whitespace-nowrap"> {tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'No timestamp'} {tx.status !== 'Success' && <span className="ml-1 text-red-500 dark:text-red-400 font-medium">({tx.status})</span>} </span>
                             </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 break-words" title={tx.details}> {tx.details || ' '} </p>
                            
                             <div className="text-xs">
                             
                                 <span className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                                     <SolanaExplorerLink
                                         type="tx"
                                         value={tx.signature}
                                         network={explorerNetwork}
                                         label={`Tx: ${tx.signature.substring(0, 6)}...${tx.signature.substring(tx.signature.length - 4)}`}
                                     />
                                 </span>
                            </div>
                         </div>
                    ))}
                </div>
            )}

             {!isLoading && !error && transactions.length === 0 && currentPageIndex === 0 && ( <div className="text-center p-6 text-gray-500 dark:text-gray-400"> No transaction history found. </div> )}
            {!isLoading && !error && transactions.length === 0 && currentPageIndex > 0 && ( <div className="text-center p-6 text-gray-500 dark:text-gray-400"> End of transaction history. </div> )}

             { (!error && (isLoading || currentPageIndex > 0 || canGoNext || (transactions.length > 0 && currentPageIndex === 0)) ) && ( // Logic to show pagination controls
                 <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                     <button onClick={handlePrevious} disabled={currentPageIndex === 0 || isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"> Previous </button>
                     <span className="text-sm text-gray-700 dark:text-gray-300"> Page {currentPageIndex + 1} {isLoading && transactions.length > 0 && ' (Loading...)'} </span>
                     <button onClick={handleNext} disabled={!canGoNext || isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"> Next </button>
                 </div>
              ) }
        </div>
    );
};

export default TransactionHistory;