/**
 * Web Push & Device Notification Service for PWA
 * Supports Android Chrome, Desktop Chrome/Edge, and iOS 16.4+ (when installed as PWA)
 */

export interface NotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission;
}

export const getNotificationStatus = (): NotificationStatus => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      isSupported: false,
      permission: 'default',
    };
  }

  return {
    isSupported: true,
    permission: Notification.permission,
  };
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return 'denied';
  }
};

export const sendDeviceNotification = async (
  title: string,
  body: string,
  tag = 'tech-service-reminder',
  data?: any
): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Prefer Service Worker registration showNotification for background & mobile screen wake
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/icon.svg',
          tag,
          vibrate: [200, 100, 200],
          data: data || { url: '/' },
        } as NotificationOptions);
        return true;
      }
    }

    // Fallback to standard Window Notification constructor
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      tag,
    });
    return true;
  } catch (err) {
    console.error('Failed to show native notification:', err);
    return false;
  }
};

export const sendTestNotification = async (): Promise<boolean> => {
  return sendDeviceNotification(
    '🛠️ Tech Service: Uji Notifikasi HP',
    'Notifikasi perangkat aktif! Anda akan menerima pengingat jadwal H-7, H-3, H-1, dan maintenance terlambat langsung di HP.',
    'test-notification'
  );
};
