self.addEventListener('push', (event) => {
  let payload = {
    title: 'African Cuisine',
    body: 'A new update is available.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const { title, ...options } = payload;
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  const url = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => {
        const clientUrl = new URL(client.url);
        return clientUrl.origin === self.location.origin;
      });

      if (matchingClient) {
        return matchingClient.navigate(url).then((client) => client?.focus());
      }

      return self.clients.openWindow(url);
    })
  );
});
