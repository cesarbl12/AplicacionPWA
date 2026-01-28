// Nombre del caché y versión
const CACHE_NAME = 'todo-pwa-v1';

// Archivos que queremos cachear (recursos estáticos)
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Evento INSTALL - Se ejecuta cuando el Service Worker se instala por primera vez
// Aquí cacheamos todos los recursos estáticos
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Cacheando archivos');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker: Instalado correctamente');
        // Forzar la activación inmediata del nuevo Service Worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error al cachear archivos:', error);
      })
  );
});

// Evento ACTIVATE - Se ejecuta cuando el Service Worker se activa
// Aquí limpiamos cachés antiguos
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Si hay un caché con nombre diferente al actual, lo eliminamos
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Eliminando caché antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activado correctamente');
        // Tomar control de todas las páginas inmediatamente
        return self.clients.claim();
      })
  );
});

// Evento FETCH - Se ejecuta cada vez que la app hace una petición de red
// Estrategia: Cache First (intenta servir desde caché, si no hay, va a la red)
self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Si encontramos el recurso en caché, lo devolvemos
        if (cachedResponse) {
          console.log('📦 Sirviendo desde caché:', event.request.url);
          return cachedResponse;
        }

        // Si no está en caché, lo pedimos a la red
        console.log('🌐 Obteniendo de la red:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Verificamos que la respuesta sea válida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clonamos la respuesta porque solo puede ser consumida una vez
            const responseToCache = networkResponse.clone();

            // Guardamos la respuesta en caché para futuras peticiones
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('❌ Error en la petición:', error);
            // Aquí podrías devolver una página offline personalizada
            // return caches.match('/offline.html');
          });
      })
  );
});

// Evento MESSAGE - Para comunicación entre el Service Worker y la aplicación
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});