/**
 * Koyamon Mart — Cart Manager
 * Cart is stored in localStorage. Syncs with backend on checkout.
 */
const KMCart = {
  _key: 'km_cart',

  get() {
    try { return JSON.parse(localStorage.getItem(this._key)) || []; }
    catch { return []; }
  },

  save(items) {
    localStorage.setItem(this._key, JSON.stringify(items));
    this._updateUI();
    window.dispatchEvent(new CustomEvent('km:cart-updated', { detail: { items } }));
  },

  add(product, variant, quantity = 1) {
    const cart = this.get();
    const idx  = cart.findIndex(i => i.productId === product._id && i.variantLabel === variant.label);
    if (idx > -1) {
      cart[idx].quantity += quantity;
    } else {
      cart.push({
        productId:    product._id,
        productName:  product.name.en,
        variantLabel: variant.label,
        variantPrice: variant.price,
        mrp:          variant.mrp,
        image:        product.images?.[0] || '',
        quantity,
      });
    }
    this.save(cart);
  },

  remove(productId, variantLabel) {
    const cart = this.get().filter(i => !(i.productId === productId && i.variantLabel === variantLabel));
    this.save(cart);
  },

  updateQty(productId, variantLabel, quantity) {
    const cart = this.get();
    const idx  = cart.findIndex(i => i.productId === productId && i.variantLabel === variantLabel);
    if (idx > -1) {
      if (quantity <= 0) return this.remove(productId, variantLabel);
      cart[idx].quantity = quantity;
      this.save(cart);
    }
  },

  clear() {
    localStorage.removeItem(this._key);
    this._updateUI();
  },

  subtotal() {
    return this.get().reduce((sum, i) => sum + i.variantPrice * i.quantity, 0);
  },

  count() {
    return this.get().reduce((sum, i) => sum + i.quantity, 0);
  },

  // Update cart badge in header
  _updateUI() {
    const badge = document.getElementById('km-cart-count');
    if (badge) {
      const count = this.count();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  // Init: update badge on page load
  init() {
    this._updateUI();
  },
};

document.addEventListener('DOMContentLoaded', () => KMCart.init());
