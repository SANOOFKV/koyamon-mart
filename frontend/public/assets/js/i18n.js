/**
 * Koyamon Mart — Language Toggle (English ↔ Malayalam)
 * Add data-en="..." data-ml="..." attributes to any element.
 * Call KMLang.init() on page load.
 */
const KMLang = {
  _key: 'km_lang',
  _current: 'en',

  get() { return localStorage.getItem(this._key) || 'en'; },

  set(lang) {
    this._current = lang;
    localStorage.setItem(this._key, lang);
    this._apply();
    this._updateToggle();
    document.documentElement.lang = lang === 'ml' ? 'ml' : 'en';
  },

  toggle() {
    this.set(this._current === 'en' ? 'ml' : 'en');
  },

  _apply() {
    const attr = `data-${this._current}`;
    document.querySelectorAll('[data-en]').forEach(el => {
      const text = el.getAttribute(attr) || el.getAttribute('data-en');
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else {
        el.innerHTML = text;
      }
    });
  },

  _updateToggle() {
    const btn = document.getElementById('km-lang-toggle');
    if (btn) btn.textContent = this._current === 'en' ? 'മലയാളം' : 'English';
  },

  init() {
    this._current = this.get();
    this._apply();
    this._updateToggle();
    document.getElementById('km-lang-toggle')?.addEventListener('click', () => this.toggle());
  },
};

document.addEventListener('DOMContentLoaded', () => KMLang.init());
