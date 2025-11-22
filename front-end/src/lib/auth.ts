/**
 * Authentication utilities and types
 */

export interface User {
  id: string;
  loginId: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

// Store auth state in memory only (access token)
// Refresh tokens are stored in HttpOnly cookies by the backend
let authState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

export const auth = {
  getState(): AuthState {
    return { ...authState };
  },

  setState(state: Partial<AuthState>) {
    authState = { ...authState, ...state };
  },

  setUser(user: User | null, accessToken: string | null) {
    authState = {
      user,
      accessToken,
      isAuthenticated: !!user && !!accessToken,
    };
  },

  clear() {
    authState = {
      user: null,
      accessToken: null,
      isAuthenticated: false,
    };
  },

  isAuthenticated(): boolean {
    return authState.isAuthenticated;
  },
};
