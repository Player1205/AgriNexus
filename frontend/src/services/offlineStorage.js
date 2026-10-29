/**
 * AgriNexus IndexedDB Offline Outbox Storage Service
 * Provides client-side persistent storage for offline crop diagnosis scans.
 * Ensures zero data loss when farmers scan in remote fields without network connectivity.
 */

export const DB_NAME = 'AgriNexusOfflineDB';
export const DB_VERSION = 1;
export const STORE_NAME = 'offline_scans';

/**
 * Initializes and opens the IndexedDB database instance.
 * Gracefully returns null if IndexedDB is unavailable or restricted.
 */
export const openDB = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('sync_status', 'sync_status', { unique: false });
          store.createIndex('created_at', 'created_at', { unique: false });
          store.createIndex('user_id', 'user_id', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.warn('[OFFLINE DB] Failed to open IndexedDB:', event.target.error);
        resolve(null);
      };
    } catch (err) {
      console.warn('[OFFLINE DB] Exception initializing IndexedDB:', err);
      resolve(null);
    }
  });
};

/**
 * Saves a completed offline crop scan into the IndexedDB outbox.
 * Marks record with sync_status: 'PENDING_SYNC'.
 */
export const saveOfflineScan = async (scanResult, userId = 'anonymous') => {
  const db = await openDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const localId =
        scanResult.id ||
        scanResult.scan_id ||
        `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const nowIso = new Date().toISOString();

      const record = {
        ...scanResult,
        id: localId,
        offline_id: localId,
        user_id: userId || 'anonymous',
        sync_status: 'PENDING_SYNC', // 'PENDING_SYNC' | 'SYNCED' | 'FAILED'
        created_at: scanResult.timestamp || scanResult.created_at || nowIso,
        updated_at: nowIso,
        is_offline_record: true,
      };

      const putRequest = store.put(record);

      putRequest.onsuccess = () => {
        console.log(`[OFFLINE DB] Saved scan '${localId}' with status 'PENDING_SYNC'.`);
        resolve(record);
      };

      putRequest.onerror = (err) => {
        console.warn('[OFFLINE DB] Error putting scan into store:', err);
        resolve(null);
      };
    } catch (err) {
      console.warn('[OFFLINE DB] Exception saving offline scan:', err);
      resolve(null);
    }
  });
};

/**
 * Retrieves all pending scans waiting to be synchronized to cloud / Base Sepolia.
 */
export const getPendingScans = async (userId = null) => {
  const db = await openDB();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = (event) => {
        const all = event.target.result || [];
        const pending = all.filter((item) => {
          const isPending = item.sync_status === 'PENDING_SYNC';
          if (!userId || userId === 'anonymous') {
            return isPending;
          }
          return isPending && item.user_id === userId;
        });
        resolve(pending);
      };

      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
};

/**
 * Retrieves all stored offline scans, sorted newest first.
 */
export const getAllOfflineScans = async (userId = null) => {
  const db = await openDB();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = (event) => {
        const all = event.target.result || [];
        const filtered = userId && userId !== 'anonymous'
          ? all.filter((item) => item.user_id === userId)
          : all;

        // Sort descending by created_at
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        resolve(filtered);
      };

      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
};

/**
 * Marks an offline scan as synced once cloud and blockchain acceptance is confirmed.
 */
export const markScanSynced = async (id, serverConfirmation = {}) => {
  const db = await openDB();
  if (!db || !id) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = (event) => {
        const record = event.target.result;
        if (!record) {
          resolve(null);
          return;
        }

        record.sync_status = 'SYNCED';
        record.synced_at = new Date().toISOString();
        if (serverConfirmation.scan_id || serverConfirmation.id) {
          record.server_scan_id = serverConfirmation.scan_id || serverConfirmation.id;
        }
        if (serverConfirmation.tx_hash) {
          record.tx_hash = serverConfirmation.tx_hash;
        }

        const putReq = store.put(record);
        putReq.onsuccess = () => {
          console.log(`[OFFLINE DB] Marked scan '${id}' as 'SYNCED'.`);
          resolve(record);
        };
        putReq.onerror = () => resolve(null);
      };

      getReq.onerror = () => resolve(null);
    } catch (err) {
      console.warn('[OFFLINE DB] Error updating scan status:', err);
      resolve(null);
    }
  });
};

/**
 * Deletes an offline scan record by its ID.
 */
export const deleteOfflineScan = async (id) => {
  const db = await openDB();
  if (!db || !id) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
};

/**
 * Returns the count of pending scans waiting to be synced.
 */
export const countPendingScans = async (userId = null) => {
  const pending = await getPendingScans(userId);
  return pending.length;
};
