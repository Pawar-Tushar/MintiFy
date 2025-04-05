import React from 'react';

interface SolanaExplorerLinkProps {
    type: 'tx' | 'address' | 'account' | 'token'; 
    value: string;
    network?: 'devnet' | 'testnet' | 'mainnet-beta';
    label?: string; 
}

const SolanaExplorerLink: React.FC<SolanaExplorerLinkProps> = ({ type, value, network = 'devnet', label }) => {
    const isMainnet = network === 'mainnet-beta';
    const clusterParam = !isMainnet ? `?cluster=${network}` : '';

    const baseUrl = `https://explorer.solana.com/${type}/${value}`;
    const url = `${baseUrl}${clusterParam}`;

    const defaultLabel = type === 'tx' ? 'View Transaction' : `View ${type.charAt(0).toUpperCase() + type.slice(1)}`; 

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline transition-colors duration-150"
        >
            {label || defaultLabel}
        </a>
    );
};

export default SolanaExplorerLink;