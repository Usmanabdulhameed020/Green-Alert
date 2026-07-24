import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  saveSubscriptionToServer,
  removeSubscriptionFromServer,
  fetchVapidPublicKey,
} from '../services/pushNotification';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [permission, setPermission] = useState('default');
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState('');

  // On mount: check if push is supported and register service worker
  useEffect(() => {
    const init = async () => {
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }

      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setPushSupported(true);
        const registration = await registerServiceWorker();
        if (registration) {
          setSwRegistration(registration);
          try {
            const sub = await registration.pushManager.getSubscription();
            if (sub) {
              setPushSubscribed(true);
            }
          } catch { /* ignore */ }
        }
      }
    };

    init();
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  /**
   * Enables push notifications: requests permission, fetches VAPID key, subscribes, saves to server.
   */
  const enablePush = useCallback(async () => {
    setPushError('');
    setPushLoading(true);

    try {
      // Step 1: Get notification permission
      if (permission !== 'granted') {
        if (Notification.permission === 'denied') {
          setPushError('Notifications are blocked in your browser. Please enable them in site settings.');
          return false;
        }
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== 'granted') {
          setPushError('You denied the notification permission. Please allow it to receive push alerts.');
          return false;
        }
      }

      // Step 2: Make sure service worker is ready
      if (!swRegistration) {
        setPushError('Service worker not ready. Please refresh the page and try again.');
        return false;
      }

      // Step 3: Fetch VAPID public key from server (always in sync)
      const publicVapidKey = await fetchVapidPublicKey();
      if (!publicVapidKey) {
        setPushError('Could not get encryption keys from server.');
        return false;
      }

      // Step 4: Subscribe via browser
      const subscription = await subscribeToPush(swRegistration, publicVapidKey);
      if (!subscription) {
        setPushError('Browser rejected the push subscription. Try a different browser (Chrome/Edge/Firefox).');
        return false;
      }

      // Step 5: Save subscription to server
      const result = await saveSubscriptionToServer(subscription);
      if (result.success) {
        setPushSubscribed(true);
        return true;
      } else {
        setPushError(result.message || 'Failed to save subscription to server.');
        return false;
      }
    } finally {
      setPushLoading(false);
    }
  }, [permission, swRegistration]);

  /**
   * Disables push notifications: unsubscribes browser first, then removes from server.
   */
  const disablePush = useCallback(async () => {
    setPushError('');
    setPushLoading(true);

    try {
      // Step 1: Unsubscribe from browser first
      let subscription = null;
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      // Step 2: Remove from server
      if (subscription) {
        await removeSubscriptionFromServer(subscription);
      }

      setPushSubscribed(false);
      return true;
    } catch (error) {
      console.error('❌ Failed to disable push:', error.message);
      setPushError('Failed to unsubscribe. Please try again.');
      return false;
    } finally {
      setPushLoading(false);
    }
  }, []);

  const sendNotification = (title, options = {}) => {
    if (permission === 'granted' && 'Notification' in window) {
      new Notification(title, {
        icon: '/GreenAlert Logo.png',
        badge: '/GreenAlert Logo.png',
        ...options,
      });
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        permission,
        pushSupported,
        pushSubscribed,
        pushLoading,
        pushError,
        setPushError,
        requestPermission,
        enablePush,
        disablePush,
        sendNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
