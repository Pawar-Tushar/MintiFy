

import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, transfer } from "@solana/spl-token";
import { useState } from "react";

const TokenManager = () => {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [amount, setAmount] = useState(1);
  const [recipient, setRecipient] = useState("");

  const handleCreateToken = async () => {
    if (!publicKey || !signTransaction) return alert("Connect your wallet");

    const mint = await createMint(
      connection,
      Keypair.generate(),
      publicKey,
      null,
      9
    );
    setMintAddress(mint.toBase58());
    alert("Token Created: " + mint.toBase58());
  };

  const handleMint = async () => {
    if (!publicKey || !mintAddress) return;

    const mint = new PublicKey(mintAddress);
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      Keypair.generate(),
      mint,
      publicKey
    );

    await mintTo(
      connection,
      Keypair.generate(),
      mint,
      tokenAccount.address,
      publicKey,
      amount * 10 ** 9
    );
    alert("Minted successfully");
  };

  const handleSend = async () => {
    if (!publicKey || !mintAddress || !recipient) return;

    const mint = new PublicKey(mintAddress);
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      Keypair.generate(),
      mint,
      publicKey
    );
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      Keypair.generate(),
      mint,
      new PublicKey(recipient)
    );

    await transfer(
      connection,
      Keypair.generate(),
      fromTokenAccount.address,
      toTokenAccount.address,
      publicKey,
      amount * 10 ** 9
    );

    alert("Transfer successful");
  };

  return (
    <div className="mt-6 space-y-4">
      <button
        onClick={handleCreateToken}
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
      >
        Create Token
      </button>
      {mintAddress && (
        <>
          <div className="mt-2">
            <p><strong>Mint Address:</strong> {mintAddress}</p>
          </div>
          <div>
            <label className="block mb-1">Amount to Mint/Send:</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="text-black px-2 py-1 rounded"
            />
          </div>
          <button
            onClick={handleMint}
            className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
          >
            Mint Tokens
          </button>
          <div>
            <label className="block mb-1">Recipient Address:</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="text-black px-2 py-1 rounded w-full"
            />
          </div>
          <button
            onClick={handleSend}
            className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700"
          >
            Send Tokens
          </button>
        </>
      )}
    </div>
  );
};

export default TokenManager;
