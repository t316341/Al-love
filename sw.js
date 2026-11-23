// SynDay service worker：負責顯示通知、點通知打開 App
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  const title = d.title || 'SynDay';
  const opts = {
    body: d.body || '有人傳訊息給你',
    tag: d.tag || 'synday',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { url: d.url || './' },
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      if ('focus' in c) { try { await c.focus(); } catch (err) {} return; }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
