import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@oesp/sdk": path.resolve(__dirname, "../oesp-ts/packages/sdk/src"),
      "@oesp/crypto-sodium": path.resolve(__dirname, "../oesp-ts/packages/crypto-sodium/src"),
      "@oesp/transport-ble-gatt": path.resolve(__dirname, "../oesp-ts/packages/transport-ble-gatt/src"),
      "@oesp/storage-memory": path.resolve(__dirname, "../oesp-ts/packages/storage-memory/src"),
      "libsodium-wrappers-sumo": path.resolve(__dirname, "./node_modules/libsodium-wrappers-sumo"),
    }
  },
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths()
  ],
})
