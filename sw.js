// SynDay service worker：負責顯示通知、點通知打開 App
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  const title = d.title || 'SynDay';
  const tag = d.tag || 'synday';
  e.waitUntil((async () => {
    // 有角色頭像的話，通知圖示改用角色頭像（Android 等支援的裝置）
    let icon = 'icon-192.png';
    const m = /^av:([^:]+):/.exec(tag);
    if (m) { try { const map = await Promise.race([getAvatars(), new Promise((r) => setTimeout(() => r(null), 1500))]); if (map && map[m[1]]) icon = map[m[1]]; } catch (err) {} }
    await self.registration.showNotification(title, {
      body: d.body || '有人傳訊息給你',
      tag,
      icon,
      badge: 'icon-192.png',
      data: { url: d.url || './' },
    });
  })());
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

// 從 App 的資料庫讀出角色頭像（App 開著時會先存好縮圖）
function getAvatars() {
  return new Promise((res) => {
    const r = indexedDB.open('jiaoseq', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('kv'); };
    r.onerror = () => res(null);
    r.onsuccess = () => {
      try {
        const q = r.result.transaction('kv').objectStore('kv').get('pushav');
        q.onsuccess = () => res(q.result || null);
        q.onerror = () => res(null);
      } catch (err) { res(null); }
    };
  });
}
