import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import { auth, User } from '@/lib/auth';
import { wsClient } from '@/lib/ws-client';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (loginIdOrEmail: string, password: string) => Promise<void>;
  signup: (data: { loginId: string; email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (loginIdOrEmail: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.login({ loginIdOrEmail, password });
      auth.setUser(response.user, response.accessToken);
      apiClient.setAccessToken(response.accessToken);
      
      // Connect WebSocket
      wsClient.connect(response.accessToken);
      wsClient.subscribe(['dashboard', 'operations', 'stock']);
      
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Login failed', isLoading: false });
      throw error;
    }
  },

  signup: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.signup(data);
      auth.setUser(response.user, response.accessToken);
      apiClient.setAccessToken(response.accessToken);
      
      // Connect WebSocket
      wsClient.connect(response.accessToken);
      wsClient.subscribe(['dashboard', 'operations', 'stock']);
      
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Signup failed', isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      auth.clear();
      apiClient.setAccessToken(null);
      wsClient.disconnect();
      set({ user: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // Try to refresh token
      const response = await apiClient.refresh();
      apiClient.setAccessToken(response.accessToken);
      
      // Get user info
      const userResponse = await apiClient.getMe();
      auth.setUser(userResponse.user, response.accessToken);
      
      // Connect WebSocket
      wsClient.connect(response.accessToken);
      wsClient.subscribe(['dashboard', 'operations', 'stock']);
      
      set({ user: userResponse.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      auth.clear();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user: User) => {
    // Update user in both Zustand store and localStorage
    auth.setUser(user, apiClient.getAccessToken() || '');
    set({ user });
  },

  clearError: () => set({ error: null }),
}));
