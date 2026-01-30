import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(() => {
  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'Satori',
        fileName: 'satori',
        formats: ['es', 'cjs']
      },
      sourcemap: true,
      outDir: './dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
    },
  };
});
