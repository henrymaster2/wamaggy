'use client';

import { useOfflineSync } from './hooks/useOfflineSync';
import { usePushNotifications } from './hooks/usePushNotifications';

export default function ClientSyncProvider() {
  // Silent background connection and cache watcher
  useOfflineSync();
  usePushNotifications();
  return null; 
}
