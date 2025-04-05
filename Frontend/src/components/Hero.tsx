
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Sparkles, Zap } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

// Removed unused props from the interface (Fix for TS2739 in parent components)
interface HeroSectionProps {
  // connectWallet: () => void; // Removed unused prop
  // walletConnected: boolean; // Removed unused prop
}

export default function HeroSection({}: HeroSectionProps) { // Now accepts an empty object satisfying the empty interface
  const { publicKey, connected } = useWallet(); // Manages its own state via useWallet
  const [solBalance, setSolBalance] = useState<string>("");

  const fetchSolBalance = async (walletPublicKey: PublicKey) => {
    try {
      // Using Devnet RPC endpoint - make sure this matches the desired network
      const connection = new Connection("https://api.devnet.solana.com", "confirmed");
      const balance = await connection.getBalance(walletPublicKey);
      // Using 1e9 (LAMPORTS_PER_SOL) for conversion
      const balanceInSol = (balance / 1e9).toFixed(2);
      setSolBalance(balanceInSol);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setSolBalance("Error"); // Show error state
    }
  };

  useEffect(() => {
    if (publicKey) {
      fetchSolBalance(publicKey);
    } else {
        setSolBalance(""); // Clear balance if wallet disconnects
    }
  }, [publicKey]); // Depend only on publicKey

  // Optional: remove these logs for production
  if (connected) {
    // console.log("Wallet connected in HeroSection");
    // console.log("Public Key:", publicKey?.toString());
    // console.log("SOL Balance:", solBalance);
  }

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-r from-purple-500/30 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-l from-pink-500/30 to-transparent blur-3xl" />
      </div>

      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
          {/* Text content */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-6">
              <div className="inline-block rounded-lg bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-sm">
                The Future of Digital Ownership
              </div>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none xl:text-7xl/none">
                Discover, Collect & Trade{" "}
                <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text">
                  Unique NFTs
                </span>
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Explore the world of digital art and collectibles. Own, buy, and sell rare digital items on the most
                user-friendly NFT marketplace.
              </p>
            </div>
            {/* Buttons and Balance Display */}
            <div className="flex flex-col gap-4 min-[400px]:flex-row">
               {/* Apply consistent styling - Example uses gradient like text */}
              <WalletMultiButton className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-medium py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg" />

              {connected && (
                <div className="flex items-center justify-center px-4 py-2 bg-black/10 dark:bg-white/10 backdrop-blur-lg rounded-lg border border-white/10 dark:border-black/10">
                  <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                  {/* Changed label for clarity */}
                   <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Balance: </span>
                   {/* Show error state or balance */}
                  <span className={`ml-1.5 font-bold text-sm ${solBalance === "Error" ? 'text-red-500 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`}>
                      {solBalance !== "Error" ? `${solBalance} SOL` : "Error"}
                   </span>
                </div>
              )}
            </div>
          </div>
          {/* Image content */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 opacity-75 blur-xl"></div>
              <div className="relative overflow-hidden rounded-2xl border border-purple-200 dark:border-purple-800 shadow-xl">
                <img
                  src="https://etimg.etb2bimg.com/thumb/msid-92363546,imgsize-53736,width-1200,height-765,overlay-ethr/trends/crypto-blockchain-nft-jobs-witness-804-rise-in-india-post-covid-report.jpg"
                  width={500}
                  height={500}
                  alt="Featured NFT Collection"
                   className="w-full h-auto object-cover rounded-t-2xl" // Consistent rounding
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-6 rounded-b-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Cosmic Dreamers</h3>
                      <p className="text-sm text-gray-300">by @artistname</p>
                    </div>
                    <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full px-3 py-1 border border-white/20">
                      <Zap className="h-4 w-4 text-yellow-400 mr-1" />
                       <span className="text-white font-medium text-sm">12.5 SOL</span> {/* Consistent text size */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}