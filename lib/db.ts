import { openDB } from 'idb';
const DB_NAME = 'WamaggyOfflineDB';
const STORE_NAME = 'sync-orders';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

export const saveOrderOffline = async (orderData: any) => {
  const db = await initDB();
  return db.add(STORE_NAME, orderData);
};

export const getOfflineOrders = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const clearOfflineOrder = async (id: number) => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};