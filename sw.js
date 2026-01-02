// Service Worker رستوران شقایق
const CACHE_NAME = 'restaurant-v1';

// فایل‌هایی که کش می‌شوند
const urlsToCache = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdn.jsdelivr.net/npm/vazir-font@30.1.0/dist/font-face.css'
];

// نصب Service Worker
self.addEventListener('install', event => {
  console.log('📦 Service Worker در حال نصب...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ کش کردن فایل‌های مهم');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('🎉 نصب کامل شد');
        return self.skipWaiting();
      })
  );
});

// فعال‌سازی
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker فعال شد');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑 حذف کش قدیمی:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// مدیریت درخواست‌ها
self.addEventListener('fetch', event => {
  // فقط درخواست‌های GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // اگر در کش بود برگردون
        if (response) {
          console.log('📂 از کش بازگردانی شد:', event.request.url);
          return response;
        }
        
        // در غیر این صورت از شبکه بگیر
        console.log('🌐 از شبکه دریافت می‌شود:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // فقط پاسخ‌های معتبر رو کش کن
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('💾 در کش ذخیره شد:', event.request.url);
              });
            
            return response;
          })
          .catch(error => {
            console.error('❌ خطا در دریافت:', error);
            // اگر آفلاین هستیم و صفحه اصلی رو می‌خواد
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('آفلاین هستید. لطفا اتصال اینترنت را بررسی کنید.', {
              status: 408,
              headers: {'Content-Type': 'text/plain; charset=utf-8'}
            });
          });
      })
  );
});

// دریافت پیام‌ها
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});