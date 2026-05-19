'use client';

import { useEffect } from 'react';

export function useOfflineSync() {
  useEffect(() => {
    const handleOnlineStatus = async () => {
      // Guard clause: stop if the connection event fired but the browser is still offline
      if (!navigator.onLine) return;

      console.log('🌐 Network status: Restored! Sweeping local cache for unsubmitted data...');
      
      try {
        // MATCHED: Importing your exact exported function names with a safe relative path
        const { getOfflineOrders, clearOfflineOrder } = await import('../../lib/db');
        const pendingOrders = await getOfflineOrders(); 
        
        if (pendingOrders.length === 0) {
          console.log('📦 Local storage clean. Zero pending actions found.');
          return;
        }

        console.log(`⏳ Found ${pendingOrders.length} pending transaction(s). Initiating synchronization loop...`);

        // Process every queued order sequentially
        for (const order of pendingOrders) {
          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
          });

          if (res.ok) {
            // MATCHED: Using clearOfflineOrder and passing the correct local database primary key
            await clearOfflineOrder(order.id);
            console.log(`✅ Order tracking UUID: ${order.id} cleanly processed and synced with backend.`);
          } else {
            console.warn(`⚠️ API refused payload for transaction reference: ${order.id}. Retrying on next cycle.`);
          }
        }
        
        alert("🎉 Connection restored! Your offline order data has been synced to the kitchen successfully.");
      } catch (error) {
        console.error('Fatal synchronization process exception:', error);
      }
    };

    // Attach event listeners for real-time networking state shifts
    window.addEventListener('online', handleOnlineStatus);
    
    // Fallback sweep: run an initial check when the page mounts in case they reloaded while online
    if (navigator.onLine) {
      handleOnlineStatus();
    }

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
    };
  }, []);
}