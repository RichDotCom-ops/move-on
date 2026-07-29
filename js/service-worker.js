const CACHE_NAME = 'moveon-v2';
const ASSETS = [
    '/move-on/',
    '/move-on/index.html',
    '/move-on/css/style.css',
    '/move-on/js/storage.js',
    '/move-on/js/screens.js',
    '/move-on/js/onboarding.js',
    '/move-on/js/main.js',
    '/move-on/manifest.json'
];

// Install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});

// Push Notification
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Time to check in on your progress. Stay strong! 💪',
        icon: '/move-on/assets/icons/icon-192.png',
        badge: '/move-on/assets/icons/icon-192.png',
        vibrate: [100, 50, 100],
        data: { url: '/move-on/' },
        actions: [
            { action: 'open', title: 'Open App' },
            { action: 'close', title: 'Dismiss' }
        ],
        tag: 'daily-reminder',
        renotify: true
    };
    
    event.waitUntil(self.registration.showNotification('Move On', options));
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes('/move-on/') && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/move-on/');
                }
            })
        );
    }
});
