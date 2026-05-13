const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_PWA !== 'true',
});

module.exports = withPWA({
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
});
