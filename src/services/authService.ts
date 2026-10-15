export interface AdminUser {
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'DEPARTMENT_COORDINATOR';
}

const ADMIN_SESSION_KEY = 'eco_bootcamp_admin_session';

export const authService = {
  login(email: string, password: string): { success: boolean; user?: AdminUser; error?: string } {
    const trimmedEmail = email.trim().toLowerCase();
    const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'EcoAdmin2026!';
    if (
      (trimmedEmail === 'admin@agmrcet.ac.in' || trimmedEmail === 'eco.admin@agmrcet.ac.in') &&
      password === expectedPassword
    ) {
      const user: AdminUser = {
        email: trimmedEmail,
        name: 'Prof. ECE Coordinator',
        role: 'SUPER_ADMIN',
      };
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
      return { success: true, user };
    }

    return {
      success: false,
      error: 'Invalid administrator credentials. Please check your official email and password.',
    };
  },

  getCurrentUser(): AdminUser | null {
    try {
      const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  logout(): void {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  },

  isAuthenticated(): boolean {
    return Boolean(this.getCurrentUser());
  },
};
