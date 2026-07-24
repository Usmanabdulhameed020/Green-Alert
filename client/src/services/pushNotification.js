/**
 * Browser Push Notification Utility
 *
 * Handles service worker registration and push subscription management.
 * Uses the free Web Push API — no paid services needed!
 */
import axios from 'axios';

/**
 * Convert a base64-encoded public VAPID key to a Uint8Array
 * (required by the Push API).
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Fetch the VAPID public key from the server.
 * Uses the Vite proxy (/api -> server) so no CORS issues.
 * @returns {Promise<string|null>}
 */
export async function fetchVapidPublicKey() {
  try {
    const res = await axios.get('/api/push/vapid-public-key');
    if (res.data?.success && res.data?.publicKey) {
      return res.data.publicKey;
    }
    console.error('❌ Server returned no VAPID public key');
    return null;
  } catch (error) {
    console.error('❌ Failed to fetch VAPID public key:', error.message);
    return null;
  }
}

/**
 * Register the service worker for the application.
 * Must be called once on app startup.
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️  Service Workers not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });
    console.log('✅ Service Worker registered successfully');
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error.message);
    return null;
  }
}

/**
 * Subscribe the current device to push notifications.
 * @param {ServiceWorkerRegistration} registration
 * @param {string} publicVapidKey - The server's public VAPID key
 * @returns {Promise<PushSubscription|null>}
 */
export async function subscribeToPush(registration, publicVapidKey) {
  if (!registration || !publicVapidKey) {
    console.warn('⚠️  Cannot subscribe: missing registration or VAPID key.');
    return null;
  }

  try {
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      console.log('📡 Already subscribed to push notifications');
      return subscription;
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });

    console.log('📡 Push subscription created successfully');
    return subscription;
  } catch (error) {
    console.error('❌ Failed to subscribe to push notifications:', error.message);
    return null;
  }
}

/**
 * Unsubscribe the current device from push notifications.
 * @returns {Promise<boolean>}
 */
export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('📡 Unsubscribed from push notifications');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Failed to unsubscribe:', error.message);
    return false;
  }
}

/**
 * Send the push subscription object to the server for storage.
 * Uses the Vite proxy (/api -> server), auth header added by axios interceptor.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function saveSubscriptionToServer(subscription) {
  if (!subscription) return { success: false, message: 'No subscription to save.' };

  try {
    const subData = subscription.toJSON();
    const res = await axios.post('/api/push/subscribe', {
      endpoint: subData.endpoint,
      keys: subData.keys,
    });
    if (res.data?.success) {
      return { success: true, message: 'Subscribed!' };
    }
    return { success: false, message: res.data?.message || 'Server did not accept subscription.' };
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    console.error('❌ Failed to save push subscription to server:', msg);
    return { success: false, message: msg };
  }
}

/**
 * Remove the push subscription from the server.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function removeSubscriptionFromServer(subscription) {
  if (!subscription) return { success: false, message: 'No subscription to remove.' };

  try {
    await axios.post('/api/push/unsubscribe', {
      endpoint: subscription.endpoint,
    });
    return { success: true, message: 'Unsubscribed!' };
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    console.error('❌ Failed to remove push subscription from server:', msg);
    return { success: false, message: msg };
  }
}
