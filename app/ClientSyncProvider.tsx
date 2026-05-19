'use client';

import { useOfflineSync } from './hooks/useOfflineSync';

export default function ClientSyncProvider() {
  // Silent background connection and cache watcher
  useOfflineSync();
  return null; 
}