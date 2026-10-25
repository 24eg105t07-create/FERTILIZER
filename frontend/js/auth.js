/**
 * AgriWise: Authentication & Client-Side Guard Utilities
 */

const AgriAuth = {
  TOKEN_KEY: 'agriwise_token',
  USER_KEY: 'agriwise_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  },

  getUser() {
    try {
      const u = localStorage.getItem(this.USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  },

  /**
   * Route Guard: Enforces role permissions on protected pages
   */
  guard(expectedRole) {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      this.clearSession();
      if (expectedRole === 'admin') {
        window.location.replace('/admin/login.html');
      } else {
        window.location.replace('/login.html');
      }
      return false;
    }

    if (expectedRole && user.role !== expectedRole) {
      // Role mismatch: redirect to their respective dashboard
      if (user.role === 'admin') {
        window.location.replace('/admin/dashboard.html');
      } else {
        window.location.replace('/farmer/dashboard.html');
      }
      return false;
    }

    return true;
  },

  /**
   * Universal API Fetch with Bearer Auth & Global Error Handling
   */
  async fetch(url, options = {}) {
    const token = this.getToken();
    const headers = {
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set application/json if FormData is used (file upload)
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        // Expired or invalid token
        this.clearSession();
        window.location.replace('/login.html');
        return { success: false, message: 'Session expired. Please sign in again.' };
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`API Fetch Error [${url}]:`, err);
      return { success: false, message: 'Network error or server unreachable. Please check your connection.' };
    }
  },

  logout() {
    const role = this.getRole();
    this.clearSession();
    if (role === 'admin') {
      window.location.replace('/admin/login.html');
    } else {
      window.location.replace('/login.html');
    }
  },

  /**
   * Toast notification helper
   */
  toast(message, type = 'success') {
    let container = document.getElementById('agri-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'agri-toast-container';
      container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; max-width: 380px;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bg = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';

    toast.style.cssText = `background: ${bg}; color: #ffffff; padding: 12px 18px; border-radius: 8px; box-shadow: 0 6px 18px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: 500; opacity: 0; transform: translateY(-10px); transition: all 0.3s ease;`;
    toast.innerHTML = `<i class="bi ${icon}" style="font-size: 1.2rem;"></i> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  /**
   * Synchronize UI Elements (Sidebar profile, user name, mobile toggle)
   */
  initUI() {
    const user = this.getUser();
    if (user) {
      const nameEls = document.querySelectorAll('.user-display-name');
      nameEls.forEach(el => { el.textContent = user.name || user.email; });

      const emailEls = document.querySelectorAll('.user-display-email');
      emailEls.forEach(el => { el.textContent = user.email; });

      const initialEls = document.querySelectorAll('.user-avatar-circle');
      initialEls.forEach(el => {
        el.textContent = (user.name ? user.name[0] : 'U').toUpperCase();
      });
    }

    // Sidebar Mobile Toggle
    const toggleBtn = document.querySelector('.btn-sidebar-toggle');
    const sidebar = document.querySelector('.dashboard-sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('show');
      });
    }

    // Highlight active menu item based on pathname
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
      if (link.getAttribute('href') && currentPath.endsWith(link.getAttribute('href'))) {
        link.classList.add('active');
      }
    });

    // Logout button bindings
    const logoutBtns = document.querySelectorAll('.btn-logout');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    });
  }
};

window.AgriAuth = AgriAuth;
