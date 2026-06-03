import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        about: 'about.html',
        cart: 'cart.html',
        category: 'category.html',
        checkout: 'checkout.html',
        login: 'login.html',
        orderConfirm: 'order-confirm.html',
        orderTracking: 'order-tracking.html',
        product: 'product.html',
        profile: 'profile.html',
        search: 'search.html'
      }
    }
  }
});
