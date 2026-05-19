import type { NextConfig } from 'next';
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_PWA !== 'true',
  runtimeCaching: [
    {
      // Intercept and cache all external and local image formats
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)(?:\?.*)?$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'wamaggy-food-images',
        expiration: {
          maxEntries: 150,           // Limits total images stored so it doesn't hog phone storage
          maxAgeSeconds: 30 * 24 * 60 * 60, // Keep food images valid for 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],        // Status 0 allows caching of opaque external URLs (like S3/Cloudinary)
        },
      },
    },
    {
      // Fallback for standard pages and navigation routes
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