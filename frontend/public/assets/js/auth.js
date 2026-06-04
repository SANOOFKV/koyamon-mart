/**
 * Koyamon Mart — Auth Manager
 * Handles OTP login flow and session state
 */
const KMAuth = {
  _userKey:  'km_user',

  getUser()   { try { return JSON.parse(localStorage.getItem(this._userKey)); } catch { return null; } },
  isLoggedIn(){ return !!this.getUser(); },

  saveSession(user) {
    localStorage.setItem(this._userKey, JSON.stringify(user));
    this._updateUI();
  },

  async logout() {
    await fetch(KM_CONFIG.API_BASE + '/auth/logout', { method: 'POST', credentials: 'include' }).catch(()=>{});
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
      this.saveSession(res.user);
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

    // Login button
    const loginBtn = document.getElementById('km-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
      });
    }

    // Logout button

    document.getElementById('km-logout-btn')?.addEventListener('click', () => {
      this.logout();
      window.location.href = '/index.html';
    });
  },
};

document.addEventListener('DOMContentLoaded', () => KMAuth.init());
