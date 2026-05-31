/**
 * Koyamon Mart — API Wrapper
 * Thin fetch wrapper around all backend endpoints
 */
const api = {
  _base: () => KM_CONFIG.API_BASE,
  _headers(path = '') {
    return {
      'Content-Type': 'application/json',
    };
  },

  async get(path) {
    const res = await fetch(this._base() + path, { headers: this._headers(path), credentials: 'include' });
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(this._base() + path, {
      method: 'POST',
      headers: this._headers(path),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return res.json();
  },

  async put(path, body) {
    const res = await fetch(this._base() + path, {
      method: 'PUT',
      headers: this._headers(path),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return res.json();
  },

  async patch(path, body) {
    const res = await fetch(this._base() + path, {
      method: 'PATCH',
      headers: this._headers(path),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return res.json();
  },

  async delete(path) {
    const res = await fetch(this._base() + path, {
      method: 'DELETE',
      headers: this._headers(path),
      credentials: 'include'
    });
    return res.json();
  },

  // ── Convenience endpoints ─────────────────────────────────────────────────
  products: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/products?${qs}`);
    },
    featured: () => api.get('/products/featured'),
    byId: (id) => api.get(`/products/${id}`),
  },

  categories: {
    list: () => api.get('/categories'),
    bySlug: (slug) => api.get(`/categories/${slug}`),
  },

  orders: {
    place: (body) => api.post('/orders', body),
    track: (orderId) => api.get(`/orders/track/${orderId}`),
    myOrders: () => api.get('/orders/my'),
  },

  delivery: {
    fee: (body) => api.post('/delivery/fee', body),
  },

  auth: {
    sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
    verifyOTP: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
    adminLogin: (email, password) => api.post('/auth/admin-login', { email, password }),
  },

  payment: {
    createOrder: (orderId) => api.post('/payment/create-order', { orderId }),
    verify: (body) => api.post('/payment/verify', body),
  },

  admin: {
    dashboard: () => api.get('/admin/dashboard'),
    products: {
      list: (params) => { const qs = new URLSearchParams(params).toString(); return api.get(`/admin/products?${qs}`); },
      create: (body) => api.post('/admin/products', body),
      update: (id, body) => api.put(`/admin/products/${id}`, body),
      delete: (id) => api.delete(`/admin/products/${id}`),
      updateStock: (id, variantLabel, stock) => api.patch(`/admin/products/${id}/stock`, { variantLabel, stock }),
    },
    categories: {
      list: () => api.get('/admin/categories'),
      create: (body) => api.post('/admin/categories', body),
      update: (id, body) => api.put(`/admin/categories/${id}`, body),
      delete: (id) => api.delete(`/admin/categories/${id}`),
      deletePermanent: (id) => api.delete(`/admin/categories/${id}/permanent`),
    },

    orders: {
      list: (params) => { const qs = new URLSearchParams(params).toString(); return api.get(`/admin/orders?${qs}`); },
      byId: (id) => api.get(`/admin/orders/${id}`),
      updateStatus: (id, status, note) => api.patch(`/admin/orders/${id}/status`, { status, note }),
      assign: (id, deliveryBoyId) => api.patch(`/admin/orders/${id}/assign`, { deliveryBoyId }),
    },
    staff: {
      listUsers: (params) => { const qs = new URLSearchParams(params).toString(); return api.get(`/admin/users?${qs}`); },
      createMember: (body) => api.post('/admin/users', body),
      updateRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }),
      listDeliveryBoys: () => api.get('/admin/delivery-boys'),
    },
    notifications: {
      list: () => api.get('/admin/notifications'),
      create: (body) => api.post('/admin/notifications', body),
    },
  },

  delivery: {
    orders: {
      my: () => api.get('/delivery/orders/my'),
      pickup: (id) => api.patch(`/delivery/orders/${id}/pickup`),
      deliver: (id) => api.patch(`/delivery/orders/${id}/deliver`),
    }
  }
};
