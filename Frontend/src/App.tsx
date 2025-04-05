import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import { useWallet } from '@solana/wallet-adapter-react';

import HomePage from './pages/Home'; 
import CreatePage from './pages/Create'; 
import Navbar from './components/Navbar'; 
import Footer from './components/Footer'; 
import MintPage from './pages/MintPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SendPage from './pages/SendPage';
import HistoryPage from './pages/HistoryPage'; 
import PortfolioPage from './pages/PortfolioPage'; 


const App: React.FC = () => {
  // const { connected, publicKey } = useWallet();

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar />

        <main className="flex-grow container mx-auto px-4 md:px-6 py-8"> 
            <Routes>
              <Route path="/" element={<HomePage />} /> 
              <Route path="/create" element={<CreatePage />} /> 
              <Route path="/mint" element={<MintPage />} />
              <Route path="/send" element={<SendPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} /> 
            </Routes>
        </main>

        <Footer />
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </Router>
  );
};

export default App;