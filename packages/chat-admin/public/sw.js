// Service Worker for Push Notifications
// Chat Admin Dashboard - Facebook Messenger Style

const CACHE_NAME = 'chat-admin-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('Cache install failed:', err))
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Handle Push Events
self.addEventListener('push', event => {
  console.log('Push event received:', event);
  
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'New Message', body: event.data.text() };
    }
  }

  const options = {
    title: data.title || 'Chat Admin',
    body: data.body || 'You have a new message',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    image: data.image,
    data: {
      url: data.url || '/',
      conversationId: data.conversationId,
      userEmail: data.userEmail,
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open Chat',
        icon: '/favicon.ico'
      },
      {
        action: 'reply',
        title: 'Quick Reply',
        icon: '/favicon.ico'
      }
    ],
    vibrate: [200, 100, 200],
    requireInteraction: true,
    tag: data.conversationId || 'default',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Handle Notification Clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification click received:', event);
  
  event.notification.close();

  if (event.action === 'reply') {
    // Handle quick reply action
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        if (clients.length > 0) {
          clients[0].postMessage({
            type: 'QUICK_REPLY',
            conversationId: event.notification.data.conversationId,
            userEmail: event.notification.data.userEmail
          });
          return clients[0].focus();
        }
        return self.clients.openWindow('/');
      })
    );
  } else {
    // Handle open action or default click
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        // Check if admin interface is already open
        for (let client of clients) {
          if (client.url === self.registration.scope) {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              conversationId: event.notification.data.conversationId,
              userEmail: event.notification.data.userEmail
            });
            return client.focus();
          }
        }
        // Open new window if not already open
        return self.clients.openWindow(event.notification.data.url || '/');
      })
    );
  }
});

// Handle Push Subscription Changes
self.addEventListener('pushsubscriptionchange', event => {
  console.log('Push subscription changed:', event);
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(
        'BPXhtDtL-3ghTIDfR6MQqMU--tftleMn_HBiUphfvZmY81iXOlfrL0Xo_WIqWKzhCm3FixnYFzgVigcaMcZt2vI'
      )
    }).then(subscription => {
      return fetch('/api/admin/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      });
    })
  );
});

// Handle Background Sync
self.addEventListener('sync', event => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync unread message counts
      fetch('/api/admin/sync')
        .then(response => response.json())
        .then(data => {
          // Update badge count
          if ('setAppBadge' in navigator) {
            navigator.setAppBadge(data.unreadCount || 0);
          }
        })
        .catch(err => console.log('Background sync failed:', err))
    );
  }
});

// Handle Messages from Main Thread
self.addEventListener('message', event => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'UPDATE_BADGE') {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(event.data.count || 0);
    }
  }
  
  if (event.data.type === 'CLEAR_BADGE') {
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge();
    }
  }
});

// Utility function to convert VAPID key
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Handle Fetch Events (for caching)
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Fetch from network
        return fetch(event.request).then(response => {
          // Don't cache if not successful
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone response for caching
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      }).catch(() => {
        // Return offline fallback if available
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});