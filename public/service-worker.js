// Service Worker للعمل بدون إنترنت (Offline Support)
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `attendance-system-${CACHE_VERSION}`;

// الملفات الأساسية التي يجب تخزينها
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/robots.txt'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: التثبيت...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('💾 تخزين الملفات الأساسية');
      return cache.addAll(CRITICAL_ASSETS).catch((err) => {
        console.warn('⚠️ تعذر تخزين بعض الملفات:', err);
        // لا نفشل عملية التثبيت إذا فشل تخزين بعض الملفات
      });
    })
  );
  
  self.skipWaiting(); // تفعيل فوري
});

// تنشيط Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: التنشيط...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ حذف الإصدارات القديمة:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim(); // تحكم فوري بجميع العملاء
});

// التقاط الطلبات والرد عليها
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // إذا كان الطلب من نفس الأصل
  if (url.origin === self.location.origin) {
    // للملفات الثابتة (JS, CSS, صور) - استراتيجية Cache First
    if (
      request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i)
    ) {
      event.respondWith(
        caches.match(request).then((response) => {
          if (response) return response;

          return fetch(request)
            .then((response) => {
              if (!response || response.status !== 200) return response;

              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });

              return response;
            })
            .catch(() => {
              // إذا فشل الطلب وليس لدينا نسخة مخزنة
              console.warn('❌ تعذر جلب:', request.url);
              return new Response('الملف غير متاح بدون إنترنت', {
                status: 404,
              });
            });
        })
      );
    }
    // للملفات الديناميكية (HTML) - استراتيجية Network First
    else if (request.method === 'GET') {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) return response;

            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // في حالة فقدان الاتصال، حاول استرجاع النسخة المخزنة
            return caches.match(request).then((response) => {
              return (
                response ||
                new Response(
                  'لا يمكن الوصول إلى هذا المحتوى. تحقق من اتصالك بالإنترنت.',
                  { status: 503 }
                )
              );
            });
          })
      );
    }
  }
});

// إرسال رسالة إلى جميع العملاء عند التحديث
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⚡ تحديث Service Worker فوري');
    self.skipWaiting();
  }
});

console.log('🌐 Service Worker جاهز للعمل بدون إنترنت!');
