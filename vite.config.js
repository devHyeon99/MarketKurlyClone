import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  resolve: {
    // @ 기호를 사용하여 src 폴더의 경로를 별칭으로 설정
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'src/pages/login/index.html'),
        register: resolve(__dirname, 'src/pages/register/index.html'),
        product_list: resolve(__dirname, 'src/pages/product-list/index.html'),
        product_detail: resolve(__dirname, 'src/pages/product-detail/index.html'),
        product_cart: resolve(__dirname, 'src/pages/product-cart/index.html'),
        product_collection: resolve(__dirname, 'src/pages/product-collection/index.html'),
        delivery: resolve(__dirname, 'src/pages/delivery/index.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  plugins: [
    // 플러그인 배열에 visualizer를 추가합니다.
    visualizer({
      open: true, // 빌드 후 자동으로 시각화 결과물을 브라우저에서 엽니다.
      filename: 'dist/stats.html', // 분석 결과 파일 이름
      gzipSize: true, // gzip 압축 후 크기를 보여줍니다.
      brotliSize: true, // brotli 압축 후 크기를 보여줍니다.
    }),
  ],
});
