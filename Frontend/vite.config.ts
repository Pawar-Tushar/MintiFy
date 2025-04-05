// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'
// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react() ,
//     tailwindcss(),
    
//   ],
// })
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// --- 1. Import the plugin ---
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // --- 2. Add the nodePolyfills plugin ---
    // This plugin handles Buffer, process, etc. automatically.
    nodePolyfills({
      // Optional: If you still encounter issues, consider enabling specific globals
      // global: true, // <- Try adding this if Buffer issues persist with just the plugin
      // Optional: Specify whether to polyfill 'buffer', 'process', etc.
      // By default, it polyfills Buffer and process.
      // protocolImports: true, // If you use node: imports like import { Buffer } from 'node:buffer'
    }),
  ],
  // --- 3. REMOVE the manual Buffer define & alias ---
  // define: {                   // <-- Remove or comment out this block
  //   'global.Buffer': Buffer,
  //   'Buffer': Buffer,
  //   'process.env': {},
  // },
  // resolve: {
  //   alias: {                  // <-- Remove or comment out this block
  //     buffer: 'buffer/',
  //   },
  // },
   optimizeDeps: {
     // --- 4. Explicitly exclude 'buffer' if using the plugin ---
     // Ensure Vite doesn't try to optimize the buffer provided by the plugin in conflicting ways
     exclude: ['buffer'],
   },
   // For smoother HMR
  server: {
      watch: {
         usePolling: true,
      },
   }
});