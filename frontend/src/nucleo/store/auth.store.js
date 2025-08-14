import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      permissions: {}, // 'module:action': boolean
      isAuthenticated: false,
      isLoading: true, // Añadido para manejar el estado de carga inicial

      setToken: (token) => set({ 
        token, 
        isAuthenticated: !!token,
        isLoading: false 
      }),

      login: (userData) => {
        set({
          user: userData.user,
          token: userData.token,
          isAuthenticated: true,
          isLoading: false,
          permissions: userData.permissions || {}
        });
      },

      logout: () => {
        set({ 
          token: null, 
          user: null, 
          permissions: {},
          isAuthenticated: false,
          isLoading: false 
        });
      },

      // Método para inicializar el estado desde el localStorage
      initialize: () => {
        const state = get();
        set({ 
          isAuthenticated: !!state.token,
          isLoading: false 
        });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Cuando se rehidrata el estado, marcar como no cargando
        if (state) {
          state.isLoading = false;
          state.isAuthenticated = !!state.token;
        }
      },
    }
  )
);