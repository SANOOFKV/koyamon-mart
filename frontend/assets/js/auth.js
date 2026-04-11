/**
 * Koyamon Mart — Auth Manager
 * Handles OTP login flow and session state
 */
const KMAuth = {
  _tokenKey: 'km_token',
  _userKey:  'km_user',

  getToken()  { return localStorage.getItem(this._tokenKey); },
  getUser()   { try { return JSON.parse(localStorage.getItem(this._userKey)); } catch { return null; } },
  isLoggedIn(){ return !!this.getToken(); },

  saveSession(token, user) {
    localStorage.setItem(this._tokenKey, token);
    localStorage.setItem(this._userKey, JSON.stringify(user));
    this._updateUI();
  },

  logout() {
    localStorage.removeItem(this._tokenKey);
    localStorage.removeItem(this._userKey);
    this._updateUI();
  },

  _updateUI() {
    const user = this.getUser();
    const loginBtn  = document.getElementById('km-login-btn');
    const userMenu  = document.getElementById('km-user-menu');
    const userName  = document.getElementById('km-user-name');
    if (user) {
      loginBtn?.classList.add('hidden');
      userMenu?.classList.remove('hidden');
      if (userName) userName.textContent = user.name || user.phone;
    } else {
      loginBtn?.classList.remove('hidden');
      userMenu?.classList.add('hidden');
    }
  },

  // ── OTP Flow ──────────────────────────────────────────────────────────────
  async sendOTP(phone) {
    const res = await api.auth.sendOTP(phone);
    return res;
  },

  async verifyOTP(phone, otp) {
    const res = await api.auth.verifyOTP(phone, otp);
    if (res.success) {
      this.saveSession(res.token, res.user);
    }
    return res;
  },

  // Redirect to login page and come back after
  requireLogin(redirectPath) {
    if (!this.isLoggedIn()) {
      window.location.href = `/checkout.html?redirect=${encodeURIComponent(redirectPath || window.location.pathname)}`;
      return false;
    }
    return true;
  },

  init() {
    this._updateUI();
    // Logout button
    document.getElementById('km-logout-btn')?.addEventListener('click', () => {
      this.logout();
      window.location.href = '/index.html';
    });
  },
};

document.addEventListener('DOMContentLoaded', () => KMAuth.init());
