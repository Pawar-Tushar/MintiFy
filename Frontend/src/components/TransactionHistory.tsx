import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
    PublicKey,
    ParsedTransactionWithMeta,
    ParsedInstruction,
    SignatureResult 
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import SolanaExplorerLink from './SolanaExplorerLink'; 
import { toast } from 'react-toastify'; 

interface SimpleTransaction {
    signature: string;
    blockTime: number | null | undefined;
    status: string; 
    type: string;  
    details: string; 
}

const ITEMS_PER_PAGE = 5;      
const FETCH_DELAY_MS = 200;    

const TransactionHistory: React.FC = () => {
    const { connection } = useConnection(); 
    const { publicKey } = useWallet();   

    const [transactions, setTransactions] = useState<SimpleTransaction[]>([]); 
    const [isLoading, setIsLoading] = useState<boolean>(false);                
    const [error, setError] = useState<string | null>(null);                    
    const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);       
    // pageSignatures[0] = undefined (start of history)
    // pageSignatures[1] = signature of the last transaction on page 0
    const [pageSignatures, setPageSignatures] = useState<(string | undefined)[]>([undefined]);
    const [canGoNext, setCanGoNext] = useState<boolean>(true);                

    const parseSplTokenInstruction = useCallback((ix: ParsedInstruction, userPublicKey: PublicKey): { type: string, details: string } => {

        if (!('parsed' in ix) || typeof ix.parsed !== 'object' || ix.parsed === null) {
            return { type: "Unknown Parsed Format", details: "Could not understand instruction format." };
        }
        const info = ix.parsed.info; 
        const type = ix.parsed.type; 

        let details = "";          
        let simpleType = "Unknown SPL"; 

        try {
            switch (type) {
                case 'mintTo':
                case 'mintToChecked':
                    simpleType = "Mint";
                    const mintAmount = info.tokenAmount?.uiAmountString ?? info.amount ?? 'N/A';
                    const mintDestination = info.account ? (info.account === userPublicKey.toBase58() ? 'You' : `${info.account.substring(0,4)}...`) : 'Unknown';
                    details = `Minted ${mintAmount} tokens of ${info.mint.substring(0,4)}... To: ${mintDestination}`;
                    if (info.mintAuthority === userPublicKey.toBase58()) {
                        details += " (As Authority)";
                    }
                    break;

                case 'transfer':
                case 'transferChecked':
                    simpleType = "Transfer";
                    const transferAmount = info.tokenAmount?.uiAmountString ?? info.amount ?? 'N/A';
                    // Make source and destination more readable ("You" or shortened address)
                    const source = info.source === userPublicKey.toBase58() ? 'You' : `${info.source?.substring(0, 4)}...`;
                    const destination = info.destination === userPublicKey.toBase58() ? 'You' : `${info.destination?.substring(0, 4)}...`;
                    details = `Transferred ${transferAmount} tokens. From: ${source}, To: ${destination}`;
                    // Check if the connected wallet authorized the transfer
                    if (info.authority === userPublicKey.toBase58()) details += " (You initiated)";

                    break;

                case 'createAssociatedTokenAccount': 
                case 'initializeAccount': 
                case 'initializeAccount2':
                case 'initializeAccount3':
                    simpleType = "Create Token Acc";
                    const ataAccount = info.account ? `${info.account.substring(0,4)}...${info.account.substring(info.account.length - 4)}` : 'Unknown Account';
                    const ataMint = info.mint ? `${info.mint.substring(0,4)}...` : 'Unknown Mint';
                    details = `Created token account ${ataAccount} for Mint ${ataMint}`;
                    if (info.owner === userPublicKey.toBase58()) details += " (Owned by You)";
                    break;

                case 'approve':
                case 'approveChecked':
                    simpleType = "Approval";
                    const approveAmount = info.tokenAmount?.uiAmountString ?? info.amount ?? 'N/A';
                    details = `Approved ${info.delegate?.substring(0,4)}... for ${approveAmount} tokens`;
                    if (info.owner === userPublicKey.toBase58()) details += " (Your account)";
                    break;

 
                default:
                    simpleType = `Unknown SPL (${type})`;
                    details = `Type: ${type}. Details: ${JSON.stringify(info).substring(0, 80)}...`; // Truncate long JSON
                    break;
            }
        } catch (parseError) {
            console.error("Error parsing SPL instruction info:", parseError, ix);
            simpleType = "Parse Error";
            details = "Could not reliably parse instruction details.";
        }

        return { type: simpleType, details };
    }, []); 

    const processTransaction = useCallback((tx: ParsedTransactionWithMeta | null, signature: string, userPublicKey: PublicKey): SimpleTransaction | null => {
        if (!tx) return null; 

        let primaryType = "Unknown"; 
        let primaryDetails = "";    
        let interactionFound = false; 
        const userKeyString = userPublicKey.toBase58();

        if (tx.transaction.message.instructions) {
            for (const ix of tx.transaction.message.instructions) {
                if ('programId' in ix && ix.programId.equals(TOKEN_PROGRAM_ID) && 'parsed' in ix) {
                    const parsedIx = parseSplTokenInstruction(ix as ParsedInstruction, userPublicKey);
                    if(parsedIx.details.includes("You") || parsedIx.details.includes(userKeyString.substring(0,4))){
                        primaryType = parsedIx.type;
                        primaryDetails = parsedIx.details;
                        interactionFound = true;
                        break; 
                    }
                }
                else if ('programId' in ix && ix.program === 'spl-associated-token-account') { 
                     primaryType = "Create ATA";
                     primaryDetails = `Created Associated Token Account`;
                     if('parsed' in ix && ix.parsed?.info?.account){
                         primaryDetails += `: ${ix.parsed.info.account.substring(0,4)}...${ix.parsed.info.account.substring(ix.parsed.info.account.length-4)}`
                     }
                      interactionFound = true;
                      break;
                 }
            }
        }

        if (!interactionFound && tx.meta?.logMessages?.some(log => log.toLowerCase().includes("program system") && log.toLowerCase().includes("transfer"))) {
            const accountKeys = tx.transaction.message.accountKeys.map(acc => acc.pubkey.toBase58());
            const userKeyIndex = accountKeys.indexOf(userKeyString); 

            if(userKeyIndex !== -1 && tx.meta) {
               const preBalance = tx.meta.preBalances[userKeyIndex];
               const postBalance = tx.meta.postBalances[userKeyIndex];
               if (preBalance !== undefined && preBalance !== null && postBalance !== undefined && postBalance !== null && preBalance !== postBalance) {
                   primaryType = "SOL Transfer";
                   const change = (postBalance - preBalance) / 1e9;
                   primaryDetails = `Balance changed by ${change.toFixed(6)} SOL`;
                   interactionFound = true;
               }
            }
        }

        if (!interactionFound) {
             const programsInvoked = [...new Set( 
                tx.transaction.message.instructions
                    .map(ix => ('programId' in ix ? ix.programId.toBase58() : null))
                    .filter(id => id && id !== '11111111111111111111111111111111') 
             )];
             if (programsInvoked.length > 0) {
                 primaryType = "Program Interaction";
                 primaryDetails = `Programs: ${programsInvoked.map(p => p.substring(0, 4)+'...').join(', ')}`;
             } else {
              
                 primaryType = "System/Other";
                 primaryDetails = "No specific token/SOL action parsed.";
             }
        }

     
        return {
            signature: signature,
            blockTime: tx.blockTime,
            status: tx.meta?.err ? 'Failed' : 'Success', 
            type: primaryType,
            details: primaryDetails,
        };
    }, [parseSplTokenInstruction]); 

    const fetchPage = useCallback(async (targetPageIndex: number) => {
        if (!publicKey || !connection) return; 

        setIsLoading(true);     
        setError(null);           
        setTransactions([]);      

        const beforeSignature = pageSignatures[targetPageIndex];
        console.log(`Fetching page ${targetPageIndex}, using 'before': ${beforeSignature ?? 'start'}`);

        let signaturesInfo: SignatureResult[] = []; 

        try {
            signaturesInfo = await connection.getSignaturesForAddress(
                publicKey,
                { limit: ITEMS_PER_PAGE, before: beforeSignature },
                'confirmed' 
            );

            if (!signaturesInfo || signaturesInfo.length === 0) {
                console.log("No transactions found for this page index.");
                setTransactions([]); 
                setCanGoNext(false);
                if (targetPageIndex === 0) { 
                    setError("No transaction history found for this wallet.");
                }
                setIsLoading(false); 
                return; 
            }

            console.log(`Fetched ${signaturesInfo.length} signatures. Getting details sequentially...`);

            const processedTxs: SimpleTransaction[] = []; 
            for (const sigInfo of signaturesInfo) {
                try {
                    await new Promise(resolve => setTimeout(resolve, FETCH_DELAY_MS));

                    console.log(`Fetching details for ${sigInfo.signature.substring(0,10)}...`);
                    const tx = await connection.getParsedTransaction(
                        sigInfo.signature,
                        { maxSupportedTransactionVersion: 0 } 
                    );

                    const processed = processTransaction(tx, sigInfo.signature, publicKey);
                    if (processed) {
                        processedTxs.push(processed);
                    } else {
                         console.warn(`Could not process transaction details for signature: ${sigInfo.signature}`);
                         processedTxs.push({ 
                             signature: sigInfo.signature,
                             blockTime: sigInfo.blockTime,
                             status: sigInfo.err ? "Failed (Process Error)" : "Unknown Status",
                             type: "Fetch Error",
                             details: "Could not retrieve/process full transaction details.",
                         });
                    }
                    // setTransactions([...processedTxs]);

                } catch (detailError: any) {
                     console.error(`Failed to fetch details for ${sigInfo.signature}:`, detailError);
        
                     processedTxs.push({
                         signature: sigInfo.signature,
                         blockTime: sigInfo.blockTime,
                         status: "Failed (Detail Fetch)",
                         type: "Fetch Error",
                         details: `Error getting details: ${detailError.message?.substring(0, 80) || 'Unknown'}`,
                     });
                      if (detailError instanceof Error && (detailError.message.includes('429') || detailError.code === 429)) {
                        toast.warning(`Rate limit hit while fetching details for ${sigInfo.signature.substring(0,6)}...`, { autoClose: 4000 });
                        setError("Rate limit hit during fetch. Results may be incomplete. Try again later or use a custom RPC.");
                        break;
                    }
                }
            } 

            console.log(`Finished fetching details for page ${targetPageIndex}. Displaying ${processedTxs.length} results.`);
            setTransactions(processedTxs); 
            setCurrentPageIndex(targetPageIndex); 

            const fetchedFullSignaturePage = signaturesInfo.length === ITEMS_PER_PAGE;
            setCanGoNext(fetchedFullSignaturePage);

            if (fetchedFullSignaturePage) {
                const nextBeforeSignature = signaturesInfo[signaturesInfo.length - 1].signature;
                setPageSignatures(prev => {
                    const newSigs = [...prev]; 
                    newSigs[targetPageIndex + 1] = nextBeforeSignature; 
                    return newSigs;
                 });
                console.log(`Stored 'before' signature for next page (${targetPageIndex + 1}): ${nextBeforeSignature.substring(0, 6)}...`);
             } else {
                 setPageSignatures(prev => prev.slice(0, targetPageIndex + 1));
                console.log(`Fetched < ${ITEMS_PER_PAGE} signatures, cannot go next.`);
            }

        } catch (err: any) {
           
            console.error(`Failed to fetch signature list for page ${targetPageIndex}:`, err);
            let displayError = `Failed to fetch history: ${err.message || 'Unknown error'}`;
       
             if (err instanceof Error && (err.message.includes('429') || err.code === 429)) {
                 displayError = "Rate limit exceeded fetching signatures. Please try again shortly.";
                 toast.warning("RPC Rate Limit hit fetching signatures.", {autoClose: 5000});
             } else {
                toast.error("Error fetching transaction signatures.");
             }
             setError(displayError);
            setCanGoNext(false); 
        } finally {
            setIsLoading(false); 
        }
    }, [publicKey, connection, processTransaction, pageSignatures]); 

    useEffect(() => {
        if (publicKey && connection) {
             console.log("Wallet connected/changed. Fetching initial history page (page 0).");
             setCurrentPageIndex(0);         
             setPageSignatures([undefined]); 
             setCanGoNext(true);            
             setError(null);          
            fetchPage(0);                   
        } else {

             setTransactions([]);
             setCurrentPageIndex(0);
             setPageSignatures([undefined]);
             setError(null);
             setIsLoading(false);
             setCanGoNext(false);
        }

    }, [publicKey, connection]); 

    const handlePrevious = () => {
        if (currentPageIndex > 0 && !isLoading) {
            fetchPage(currentPageIndex - 1);
        }
    };


    const handleNext = () => {
        if (canGoNext && !isLoading) {
            fetchPage(currentPageIndex + 1);
        }
    };

    const getNetwork = () => {
        if (!connection) return 'mainnet-beta'; 
        const endpoint = connection.rpcEndpoint;
        if (endpoint.includes('devnet')) return 'devnet';
        if (endpoint.includes('testnet')) return 'testnet';
        return 'mainnet-beta'; 
    };
    const network = getNetwork();


    return (
        <div className="transaction-history-container space-y-4">

            {isLoading && (
                <div className="flex justify-center items-center p-6 text-gray-600 dark:text-gray-400">
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                    <span>Loading transactions...</span>
                </div>
            )}

            {!isLoading && error && (
                 <div className="text-center p-4 bg-red-50 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                 </div>
            )}

            {!isLoading && transactions.length > 0 && (
                <div className="transaction-history-list space-y-3">
                    {transactions.map((tx) => (
                        <div key={tx.signature} className={`p-3 rounded-lg shadow-sm border transition-opacity duration-300 ${
                       
                            tx.status.includes('Failed') || tx.type === 'Fetch Error'
                                ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 opacity-80'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}>
                       
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full leading-tight whitespace-nowrap ${
                                
                                    tx.type.includes("Mint") ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                    tx.type.includes("Transfer") ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                    tx.type.includes("Create") ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                    tx.type.includes("SOL") ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    tx.type.includes("Error") ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : // Specific style for fetch errors
                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' // Default/unknown type
                                }`}>
                                    {tx.type} 
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2 text-right">
                                   
                                    {tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}) + ' ' + new Date(tx.blockTime * 1000).toLocaleDateString([], { month: 'short', day: 'numeric'}) : 'No timestamp'}
                                   
                                    {(tx.status.includes('Failed') || tx.status.includes('Error')) && <span className="ml-1 text-red-500 dark:text-red-400 font-medium">({tx.status})</span>}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 break-words" title={tx.details}>
                                {tx.details || ' '} {/* Display parsed details */}
                            </p>
                            <div className="text-xs">
                                <SolanaExplorerLink type="tx" value={tx.signature} network={network} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && !error && transactions.length === 0 && currentPageIndex === 0 && (
               <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                   No recent transactions found for this wallet on the {network} network.
               </div>
            )}

             {!isLoading && !error && transactions.length === 0 && currentPageIndex > 0 && (
               <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                   No more transactions found.
               </div>
            )}

            
            {(transactions.length > 0 || currentPageIndex > 0 || canGoNext ) && !error ? (
               <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  
                    <button
                        onClick={handlePrevious}
                        disabled={currentPageIndex === 0 || isLoading} // Disabled on page 0 or while loading
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
                    >
                        Previous
                    </button>
                   
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Page {currentPageIndex + 1}
                        {isLoading ? ' (Loading...)' : ''}
                    </span>
                  
                    <button
                        onClick={handleNext}
                        disabled={!canGoNext || isLoading} // Disabled if no next page known or while loading
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
                    >
                        Next
                    </button>
                </div>
            ) : null  }

        </div>
    );
};

export default TransactionHistory;