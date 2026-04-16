import { useNotifications } from '../../../../../src/hooks/useApp';
import { Notification } from '../../../../../src/types';

export const NotificationCenter = () => {
  const { notifications, removeNotification } = useNotifications();

  const getColors = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '●';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 space-y-2 pointer-events-none z-50">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`border p-4 rounded-lg shadow-lg pointer-events-auto animate-in slide-in-from-right ${getColors(
            notification.type
          )}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0">{getIcon(notification.type)}</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 text-lg cursor-pointer flex-shrink-0 hover:opacity-70"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
