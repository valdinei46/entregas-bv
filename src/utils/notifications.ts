/**
 * Push notifications and in-app browser alert utilities
 */

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
}

export function sendBrowserPushNotification(title: string, body: string, icon = '🛵') {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch {
      // Notification failed or in background
    }
  }
}
