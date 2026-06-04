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
        search: 'search.html',
        adminBulkUpload: 'admin/bulk-upload.html',
        adminCategories: 'admin/categories.html',
        adminDashboard: 'admin/dashboard.html',
        adminInventory: 'admin/inventory.html',
        adminNotifications: 'admin/notifications.html',
        adminOrders: 'admin/orders.html',
        adminProducts: 'admin/products.html',
        deliveryDashboard: 'delivery/dashboard.html'
      }
    }
  }
});
