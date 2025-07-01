export class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'light';
  }

  init() {
    this.applyTheme(this.currentTheme);
    
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
      this.updateToggleIcon();
    }
  }

  toggle() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    this.updateToggleIcon();
    localStorage.setItem('theme', this.currentTheme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
    }
  }

  updateToggleIcon() {
    const icon = document.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}