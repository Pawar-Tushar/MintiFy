

const DocumentationSection = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-100 to-pink-100" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-r from-purple-500/30 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-l from-pink-500/30 to-transparent blur-3xl" />
      </div>

      <div className="container px-4 md:px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          <h1 className="text-4xl font-bold tracking-tighter text-center sm:text-5xl md:text-6xl lg:text-7xl/none">
            <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text">
              MintyFy Documentation
            </span>
          </h1>
          <div className="prose prose-lg max-w-none prose-p:text-muted-foreground prose-headings:text-gray-800 prose-strong:text-gray-700">
            <p className="text-center text-lg text-muted-foreground">
              Welcome to the MintyFy Documentation! MintyFy is an intuitive, user-friendly application built for creating, minting, and managing Solana-based SPL tokens. It allows users to seamlessly interact with the Solana blockchain, check their wallet history, view portfolio performance, and mint and send custom tokens to others. The app offers a smooth UI/UX experience to ensure an easy navigation process for all users.
            </p>

            <hr className="my-8 border-purple-200" />

            <section id="features" className="space-y-6">
              <h2 className="text-3xl font-semibold tracking-tight text-gray-900 border-l-4 border-purple-500 pl-4">
                Features of MintyFy
              </h2>

              <div className="space-y-4 pl-4">
                <h3 className="text-2xl font-medium text-gray-800 mt-4">1. Token Creator</h3>
                <p>
                  MintyFy provides a dedicated space for users to create their own Solana-based SPL tokens. Whether you're an individual or a developer, creating your custom tokens is made easy and efficient.
                </p>
                <ul className="list-disc list-outside space-y-2 pl-6 text-muted-foreground">
                  <li><strong>Create Custom Tokens:</strong> Generate tokens using the easy-to-follow steps, setting attributes such as token name, symbol, and total supply.</li>
                  <li><strong>User-friendly Interface:</strong> With a simple, intuitive interface, users can generate tokens without needing any advanced technical knowledge.</li>
                </ul>

                <h3 className="text-2xl font-medium text-gray-800 mt-6">2. Mint Token</h3>
                <p>
                  After creating your SPL token, MintyFy enables you to mint them into your wallet. With just a few clicks, you can add tokens to your Solana address.
                </p>
                 <ul className="list-disc list-outside space-y-2 pl-6 text-muted-foreground">
                    <li><strong>Quick Minting Process:</strong> Once a token is created, minting it into your wallet is quick and hassle-free.</li>
                    <li><strong>Instant Confirmation:</strong> The system ensures minting requests are processed rapidly, allowing you to keep track of your newly minted tokens.</li>
                  </ul>


                <h3 className="text-2xl font-medium text-gray-800 mt-6">3. Send Token</h3>
                <p>
                 MintyFy allows users to send minted tokens to any Solana wallet address directly from the application.
                </p>
                <ul className="list-disc list-outside space-y-2 pl-6 text-muted-foreground">
                    <li><strong>Easy Token Transfers:</strong> Send tokens quickly and easily to friends or users within the Solana ecosystem.</li>
                    <li><strong>Token Management:</strong> You can manage multiple tokens and send them in a streamlined manner.</li>
                </ul>

                <h3 className="text-2xl font-medium text-gray-800 mt-6">4. History</h3>
                <p>
                 Keep track of all your wallet activities in a comprehensive history log. This section allows users to see their transaction history, token creations, and more.
                </p>
                 <ul className="list-disc list-outside space-y-2 pl-6 text-muted-foreground">
                    <li><strong>Detailed Logs:</strong> View the full history of wallet transactions, including token minting, transfers, and wallet interactions.</li>
                    <li><strong>User-Friendly Filters:</strong> Sort transactions by date, type, or amount for easy review of your account history.</li>
                  </ul>


                <h3 className="text-2xl font-medium text-gray-800 mt-6">5. Portfolio</h3>
                <p>
                   The Portfolio section of MintyFy allows you to monitor your token holdings and evaluate their current value in the market.
                </p>
                  <ul className="list-disc list-outside space-y-2 pl-6 text-muted-foreground">
                    <li><strong>Real-time Updates:</strong> Get up-to-date values for your SPL tokens in your portfolio.</li>
                    <li><strong>Token Insights:</strong> View the amount of each token you hold, its performance, and growth over time.</li>
                 </ul>

              </div>
            </section>

            <hr className="my-8 border-purple-200" />

             <section id="registration" className="space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight text-gray-900 border-l-4 border-purple-500 pl-4">
                Registration
              </h2>
                <p className="pl-4">
                   MintyFy supports wallet-based authentication using popular Solana wallets such as <strong>Phantom</strong> and <strong>Solflare</strong>. The registration process is secure, fast, and ensures smooth user onboarding.
                 </p>
                <ul className="list-disc list-outside space-y-2 pl-10 text-muted-foreground">
                 <li><strong>Connect Your Wallet:</strong> Simply connect your Phantom or Solflare wallet to get started.</li>
                 <li><strong>Easy Setup:</strong> Upon wallet connection, your account will be automatically registered, and you can begin using the application right away.</li>
              </ul>
            </section>

            <hr className="my-8 border-purple-200" />

             {/* UI/UX Design Section */}
             <section id="ui-ux" className="space-y-4">
                <h2 className="text-3xl font-semibold tracking-tight text-gray-900 border-l-4 border-purple-500 pl-4">
                    UI/UX Design
                </h2>
                <p className="pl-4">
                    MintyFy is designed with a focus on usability and user experience. Our goal is to ensure that even beginners can easily navigate through the app and use all the features without feeling overwhelmed.
                </p>
                 <ul className="list-disc list-outside space-y-2 pl-10 text-muted-foreground">
                    <li><strong>Sleek Design:</strong> The app follows modern UI principles with a clean layout and clear navigation.</li>
                    <li><strong>Intuitive Experience:</strong> Features are well-organized into sections, making it easy for users to find what they need and complete tasks without unnecessary complexity.</li>
                 </ul>
            </section>

             <hr className="my-8 border-purple-200" />

            {/* Troubleshooting Section */}
             <section id="troubleshooting" className="space-y-4">
                <h2 className="text-3xl font-semibold tracking-tight text-gray-900 border-l-4 border-pink-500 pl-4">
                     Troubleshooting
                </h2>
                <p className="pl-4">
                  In case you encounter issues while using MintyFy, here are some common problems and solutions:
                 </p>

                 <ol className="list-decimal list-outside space-y-4 pl-10 text-muted-foreground">
                    <li>
                        <strong className="text-gray-700">Can't Connect Wallet</strong><br/>
                        <strong>Solution:</strong> Ensure that your Phantom or Solflare wallet is correctly installed and up to date. Try reconnecting your wallet by clicking the "Connect Wallet" button.
                     </li>
                    <li>
                         <strong className="text-gray-700">Token Minting Failed</strong><br/>
                         <strong>Solution:</strong> Double-check that the token creation process was completed successfully. If minting fails, ensure that your Solana wallet has enough SOL to cover transaction fees.
                     </li>
                    <li>
                         <strong className="text-gray-700">Transaction Not Showing in History</strong><br/>
                        <strong>Solution:</strong> Refresh the history page. If the transaction still doesn't appear, ensure the transaction was completed successfully by checking the Solana explorer for confirmation.
                    </li>
                     <li>
                         <strong className="text-gray-700">Portfolio Not Updating</strong><br/>
                        <strong>Solution:</strong> Refresh your portfolio page. If the issue persists, check the Solana network status to ensure there are no delays in processing transactions.
                    </li>
                 </ol>
                  <p className="pl-4">
                    If you're facing any issues not listed above, feel free to reach out for support.
                  </p>
            </section>


             <hr className="my-8 border-purple-200" />

             {/* Contribution Section */}
             <section id="contribute" className="space-y-4">
                 <h2 className="text-3xl font-semibold tracking-tight text-gray-900 border-l-4 border-purple-500 pl-4">
                     Contribute to MintyFy
                </h2>
                 <p className="pl-4">
                    MintyFy is an open-source project, and we welcome contributions from the community. If you're a developer, designer, or enthusiast, we invite you to contribute and help improve the app.
                 </p>
                 <p className="pl-4">
                    You can find the source code and report issues on our <a href="https://github.com/Pawar-Tushar/MintiFy" target="_blank" rel="noopener noreferrer" className="font-medium text-purple-600 hover:text-purple-800 hover:underline">GitHub Repository</a>.
                 </p>
                 <p className="pl-4">
                   For any questions or further communication, don't hesitate to reach out via email at: <a href="mailto:tusharpawar749963@gmail.com" className="font-medium text-purple-600 hover:text-purple-800 hover:underline">tusharpawar749963@gmail.com</a>.
                 </p>
                <p className="pl-4">
                    We look forward to collaborating with you!
                 </p>
            </section>


            <hr className="my-8 border-purple-200" />


             <section id="collaboration" className="space-y-4 text-center bg-gradient-to-r from-purple-100 to-pink-100 p-8 rounded-lg shadow">
                 <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
                     Call for Collaboration
                 </h2>
                 <p className="text-muted-foreground">
                    At MintyFy, we believe that collaboration fosters growth. If you have any ideas, improvements, or features you'd like to contribute, we encourage you to join the MintyFy community.
                 </p>
                <p className="text-muted-foreground">
                    Together, we can build an even more powerful and feature-rich platform. Don’t forget to visit our <a href="https://github.com/Pawar-Tushar/MintiFy" target="_blank" rel="noopener noreferrer" className="font-medium text-purple-600 hover:text-purple-800 hover:underline">GitHub Repository</a> and contribute today!
                 </p>
                 <p className="mt-4 font-medium text-lg bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text">
                     Thank you for being a part of the MintyFy journey!
                </p>
             </section>


           </div>
        </div> 
      </div>
    </section>
  );
};

export default DocumentationSection;

