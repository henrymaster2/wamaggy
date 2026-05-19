import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_PWA !== 'true',
  runtimeCaching: [
    {
      // 1. Intercept and cache all external and local image formats
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)(?:\?.*)?$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'wamaggy-food-images',
        expiration: {
          maxEntries: 150,                 // Limits total images stored so it doesn't hog phone storage
          maxAgeSeconds: 30 * 24 * 60 * 60, // Keep food images valid for 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],              // Status 0 allows caching of opaque external URLs
        },
      },
    },
    {
      // 2. Dynamic Pages Caching (Stops the offline blank screen)
      // Added explicit :any typings to satisfy strict compiler demands
      urlPattern: ({ url, request }: { url: any; request: any }) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const isSameOrigin = url.origin === origin;
        const isApi = url.pathname.startsWith('/api/');
        const isNextStatic = url.pathname.startsWith('/_next/');
        return isSameOrigin && !isApi && !isNextStatic;
      },
      handler: 'NetworkFirst',
      options: {
        cacheName: 'wamaggy-pages-cache',
        networkTimeoutSeconds: 2,           // Drop back to cached screens in 2 seconds if network fails
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60,  // Cache structural layouts for 7 days
        },
      },
    },
    {
      // 3. Food API Menu Items Data Cache
      // Added explicit :any typings to satisfy strict compiler demands
      urlPattern: ({ url }: { url: any }) => {
        return url.pathname.startsWith('/api/food');
      },
      handler: 'NetworkFirst',
      options: {
        cacheName: 'wamaggy-menu-api-cache',
        networkTimeoutSeconds: 2,           // Load cached meals instantly if server can't be reached
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 24 * 60 * 60,      // Keep meal lists stored for 24 hours
        },
      },
    },
    {
      // 4. Google Fonts Pipeline
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
};

export default withPWA(nextConfig);
