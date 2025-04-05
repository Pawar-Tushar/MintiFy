// import React from 'react';

// const Footer: React.FC = () => {
//   return (
//     <footer className="bg-gray-800 text-gray-400 py-6 px-6 mt-auto">
//       <div className="container mx-auto text-center">
//         <p>© {new Date().getFullYear()} Solana SPL Token Manager. All rights reserved.</p>
//         <p className="text-sm mt-2">Built for Devnet Interaction</p>
//         {/* Add social links or other info if needed */}
//       </div>
//     </footer>
//   );
// };

// export default Footer;


import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-gray-400 py-6 px-6 mt-auto">
      <div className="container mx-auto text-center">
        <p>© {new Date().getFullYear()} MintiFy. All rights reserved.</p>
        <p className="text-sm mt-2">Built by Tushar Pawar. Check out my work on <a href="https://github.com/Pawar-Tushar" className="text-blue-400" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>
        <p className="text-sm mt-2">Built for Devnet Interaction</p>
      </div>
    </footer>
  );
};

export default Footer;
