import React, { createContext, useContext, useState, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  notify: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((message: string, type: NotificationType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-5 left-5 z-[10000] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`
              pointer-events-auto min-w-[300px] p-4 rounded-lg shadow-lg border-r-4 flex items-center justify-between animate-slide-in bg-card
              ${n.type === 'success' ? 'border-success' : ''}
              ${n.type === 'error' ? 'border-destructive' : ''}
              ${n.type === 'info' ? 'border-primary' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              <span className={`text-xl ${
                n.type === 'success' ? 'text-success' : 
                n.type === 'error' ? 'text-destructive' : 
                'text-primary'
              }`}>
                {n.type === 'success' && '✓'}
                {n.type === 'error' && '✕'}
                {n.type === 'info' && 'ℹ'}
              </span>
              <span className="font-medium text-sm text-foreground">{n.message}</span>
            </div>
            <button 
              onClick={() => removeNotification(n.id)} 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
