// Notification Service for Facebook Messenger-style Admin Interface
// Handles Web Push API, browser notifications, and real-time alerts

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  data?: {
    conversationId?: string;
    userEmail?: string;
    url?: string;
    timestamp?: number;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class NotificationService {
  private vapidPublicKey = 'BLVXH6ipGcknKngbsLMRZDUBpjT5o8sbz4Y1o921zlOpCsQTGEr1GGhBx6-aLsnIu5qM-J21ZuR1eXCWfbwB3Kw';
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: globalThis.PushSubscription | null = null;
  private permissionGranted = false;
  private onNotificationClick: ((data: any) => void) | null = null;

  constructor() {
    this.initializeServiceWorker();
    this.setupMessageListener();
  }

  /**
   * Initialize Service Worker for push notifications
   */
  private async initializeServiceWorker(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered successfully:', this.serviceWorkerRegistration);

        // Handle service worker updates
        this.serviceWorkerRegistration.addEventListener('updatefound', () => {
          const newWorker = this.serviceWorkerRegistration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker available, refreshing...');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });

        // Listen for service worker controller changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service Worker controller changed, reloading page...');
          window.location.reload();
        });

      } else {
        console.warn('Service Worker not supported in this browser');
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Setup message listener for Service Worker communication
   */
  private setupMessageListener(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        console.log('Message from Service Worker:', event.data);

        switch (event.data.type) {
          case 'NOTIFICATION_CLICK':
            if (this.onNotificationClick) {
              this.onNotificationClick(event.data);
            }
            break;
          case 'QUICK_REPLY':
            this.handleQuickReply(event.data);
            break;
        }
      });
    }
  }

  /**
   * Request notification permissions from user
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
      }

      let permission = Notification.permission;

      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      this.permissionGranted = permission === 'granted';
      
      if (this.permissionGranted) {
        console.log('Notification permission granted');
        await this.subscribeToPush();
      } else {
        console.warn('Notification permission denied');
      }

      return this.permissionGranted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToPush(): Promise<void> {
    try {
      if (!this.serviceWorkerRegistration) {
        console.error('Service Worker not registered');
        return;
      }

      const existingSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (existingSubscription) {
        this.pushSubscription = existingSubscription;
        console.log('Using existing push subscription');
      } else {
        this.pushSubscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlB64ToUint8Array(this.vapidPublicKey)
        });
        console.log('Created new push subscription');
      }

      if (this.pushSubscription) {
        await this.sendSubscriptionToServer(this.pushSubscription);
      }

    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: globalThis.PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/admin/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.getKey('p256dh') ? 
              this.arrayBufferToBase64(subscription.getKey('p256dh')!) : '',
            auth: subscription.getKey('auth') ? 
              this.arrayBufferToBase64(subscription.getKey('auth')!) : ''
          }
        })
      });

      if (response.ok) {
        console.log('Push subscription sent to server successfully');
      } else {
        console.error('Failed to send push subscription to server');
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  /**
   * Show local notification (when app is active)
   */
  showNotification(data: NotificationData): void {
    if (!this.permissionGranted) {
      console.warn('Notification permission not granted');
      return;
    }

    if ('serviceWorker' in navigator && this.serviceWorkerRegistration) {
      // Use Service Worker for consistent notification handling
      this.serviceWorkerRegistration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: data.badge || '/favicon.ico',
        data: data.data,
        tag: data.data?.conversationId || 'default'
      });
    } else {
      // Fallback to basic notification
      new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        data: data.data
      });
    }

    // Play notification sound
    this.playNotificationSound();
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => {
        // Ignore autoplay policy errors
        console.log('Could not play notification sound:', e.message);
      });
    } catch (error) {
      console.log('Notification sound not available');
    }
  }

  /**
   * Update browser badge count
   */
  updateBadge(count: number): void {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(count).catch(console.error);
    }

    // Also update via Service Worker for cross-browser support
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_BADGE',
        count: count
      });
    }

    // Update document title with count
    const baseTitle = 'Chat Admin Dashboard';
    document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;
  }

  /**
   * Clear browser badge
   */
  clearBadge(): void {
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(console.error);
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_BADGE'
      });
    }

    document.title = 'Chat Admin Dashboard';
  }

  /**
   * Handle notification click callback
   */
  onNotificationClickHandler(callback: (data: any) => void): void {
    this.onNotificationClick = callback;
  }

  /**
   * Handle quick reply from notification
   */
  private handleQuickReply(data: any): void {
    console.log('Quick reply requested:', data);
    // This would trigger a quick reply modal or interface
    if (this.onNotificationClick) {
      this.onNotificationClick({ ...data, action: 'quickReply' });
    }
  }

  /**
   * Check if notifications are supported and permitted
   */
  isAvailable(): boolean {
    return 'Notification' in window && this.permissionGranted;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Utility: Convert VAPID key to Uint8Array
   */
  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Utility: Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    try {
      if (this.pushSubscription) {
        await this.pushSubscription.unsubscribe();
        this.pushSubscription = null;
        console.log('Unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();