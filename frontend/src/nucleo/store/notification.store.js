/**
 * Store simplificado de notificaciones
 * 
 * Sistema eficiente para notificaciones de UI sin backend complexity
 */

import { create } from 'zustand';

const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error', 
  WARNING: 'warning',
  INFO: 'info'
};

const DURATIONS = {
  success: 4000,
  error: 8000,
  warning: 6000,
  info: 5000
};

export const useNotificationStore = create((set, get) => ({
  notifications: [],

  addNotification: (type, title, message, options = {}) => {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notification = {
      id,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      persistent: options.persistent || type === 'error'
    };

    set(state => ({
      notifications: [notification, ...state.notifications].slice(0, 50) // Máximo 50
    }));

    // Auto-remove para notificaciones no persistentes
    if (!notification.persistent) {
      setTimeout(() => {
        get().removeNotification(id);
      }, options.duration || DURATIONS[type]);
    }

    return id;
  },

  removeNotification: (id) => set(state => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  clearAll: () => set({ notifications: [] }),

  // Métodos de conveniencia
  success: (message, title = 'Éxito', options = {}) => 
    get().addNotification('success', title, message, options),
    
  error: (message, title = 'Error', options = {}) => 
    get().addNotification('error', title, message, { persistent: true, ...options }),
    
  warning: (message, title = 'Advertencia', options = {}) => 
    get().addNotification('warning', title, message, options),
    
  info: (message, title = 'Información', options = {}) => 
    get().addNotification('info', title, message, options)
}));

// Hook simplificado para usar en componentes
export const useNotifications = () => {
  const { success, error, warning, info, removeNotification, clearAll } = useNotificationStore();
  
  return {
    success, 
    error, 
    warning, 
    info,
    remove: removeNotification,
    clearAll
  };
};

export { NOTIFICATION_TYPES };
