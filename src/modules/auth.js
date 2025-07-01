export class AuthManager {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
  }

  async login(username, password) {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: username, pass: password }),
      });

      const data = await response.json();
      
      if (data.ok) {
        localStorage.setItem('currentUser', username);
        return true;
      }
      return false;
    } catch (error) {
      // Fallback for offline mode
      console.warn('Server unavailable, using offline mode');
      localStorage.setItem('currentUser', username);
      return true;
    }
  }

  async register(username, password) {
    try {
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: username, pass: password }),
      });

      const data = await response.json();
      return data.ok;
    } catch (error) {
      // Fallback for offline mode
      console.warn('Server unavailable, using offline mode');
      return true;
    }
  }

  logout() {
    localStorage.removeItem('currentUser');
    window.location.reload();
  }

  getCurrentUser() {
    return localStorage.getItem('currentUser');
  }

  isAuthenticated() {
    return !!this.getCurrentUser();
  }
}