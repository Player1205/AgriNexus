/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  openDB,
  saveOfflineScan,
  getPendingScans,
  getAllOfflineScans,
  markScanSynced,
  deleteOfflineScan,
  countPendingScans,
  DB_NAME,
  STORE_NAME
} from '../services/offlineStorage';
import { syncPendingScans } from '../services/offlineSyncEngine';

// Lightweight in-memory IndexedDB mock for Vitest / JSDOM environment
function createMockIndexedDB() {
  const stores = new Map();

  return {
    _stores: stores,
    open(dbName, version) {
      const request = {
        result: null,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };

      setTimeout(() => {
        if (!stores.has(STORE_NAME)) {
          stores.set(STORE_NAME, new Map());
        }

        const db = {
          name: dbName,
          version,
          objectStoreNames: {
            contains: (name) => stores.has(name),
          },
          createObjectStore(name, { keyPath }) {
            const storeData = new Map();
            stores.set(name, storeData);
            return {
              createIndex: vi.fn(),
            };
          },
          transaction(storeNames, mode) {
            const storeName = Array.isArray(storeNames) ? storeNames[0] : storeNames;
            const targetStore = stores.get(storeName);

            return {
              objectStore(name) {
                return {
                  put(item) {
                    const req = { result: null, onsuccess: null, onerror: null };
                    setTimeout(() => {
                      const key = item[item.keyPath || 'id'];
                      targetStore.set(key, JSON.parse(JSON.stringify(item)));
                      req.result = key;
                      if (req.onsuccess) req.onsuccess({ target: req });
                    }, 0);
                    return req;
                  },
                  get(key) {
                    const req = { result: null, onsuccess: null, onerror: null };
                    setTimeout(() => {
                      req.result = targetStore.get(key) ? JSON.parse(JSON.stringify(targetStore.get(key))) : undefined;
                      if (req.onsuccess) req.onsuccess({ target: req });
                    }, 0);
                    return req;
                  },
                  getAll() {
                    const req = { result: null, onsuccess: null, onerror: null };
                    setTimeout(() => {
                      req.result = Array.from(targetStore.values()).map(v => JSON.parse(JSON.stringify(v)));
                      if (req.onsuccess) req.onsuccess({ target: req });
                    }, 0);
                    return req;
                  },
                  delete(key) {
                    const req = { result: null, onsuccess: null, onerror: null };
                    setTimeout(() => {
                      targetStore.delete(key);
                      req.result = true;
                      if (req.onsuccess) req.onsuccess({ target: req });
                    }, 0);
                    return req;
                  },
                  index(indexName) {
                    return {
                      getAll(query) {
                        const req = { result: null, onsuccess: null, onerror: null };
                        setTimeout(() => {
                          const all = Array.from(targetStore.values()).map(v => JSON.parse(JSON.stringify(v)));
                          const filtered = query ? all.filter(item => item[indexName] === query) : all;
                          req.result = filtered;
                          if (req.onsuccess) req.onsuccess({ target: req });
                        }, 0);
                        return req;
                      }
                    };
                  }
                };
              }
            };
          },
          close: vi.fn(),
        };

        request.result = db;
        if (request.onupgradeneeded) {
          request.onupgradeneeded({ target: request });
        }
        if (request.onsuccess) {
          request.onsuccess({ target: request });
        }
      }, 0);

      return request;
    }
  };
}

describe('IndexedDB Offline Storage & Sync Engine Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.indexedDB = createMockIndexedDB();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  it('1. Initializes IndexedDB database and object store cleanly', async () => {
    const db = await openDB();
    expect(db).toBeDefined();
    expect(db.objectStoreNames.contains(STORE_NAME)).toBe(true);
  });

  it('2. Saves an offline scan with PENDING_SYNC status and assigns an ID', async () => {
    const mockScan = {
      vision_diagnosis: 'Tomato Late Blight',
      vision_confidence: 0.98,
      is_crop_supported: true,
      proposed_chemical: 'Dimethomorph 50% WP',
      safe_dosage_ml_per_acre: 200,
      dosage_unit: 'g',
      is_safe: true
    };

    const saved = await saveOfflineScan(mockScan, 'user_123');
    expect(saved).toBeDefined();
    expect(saved.id).toBeDefined();
    expect(saved.sync_status).toBe('PENDING_SYNC');
    expect(saved.user_id).toBe('user_123');
    expect(saved.vision_diagnosis).toBe('Tomato Late Blight');
  });

  it('3. Retrieves only pending scans for a given user', async () => {
    await saveOfflineScan({ vision_diagnosis: 'Potato Early Blight' }, 'user_1');
    await saveOfflineScan({ vision_diagnosis: 'Tomato Late Blight' }, 'user_1');

    const pending = await getPendingScans('user_1');
    expect(pending.length).toBe(2);
    expect(pending[0].sync_status).toBe('PENDING_SYNC');
  });

  it('4. Correctly counts pending scans in the offline queue', async () => {
    await saveOfflineScan({ vision_diagnosis: 'Corn Common Rust' }, 'user_1');
    const count = await countPendingScans('user_1');
    expect(count).toBe(1);
  });

  it('5. Transitions a scan to SYNCED status with server confirmation metadata', async () => {
    const saved = await saveOfflineScan({ vision_diagnosis: 'Apple Scab' }, 'user_1');
    
    const synced = await markScanSynced(saved.id, {
      scan_id: 'server_scan_999',
      tx_hash: '0xabc123def456'
    });

    expect(synced.sync_status).toBe('SYNCED');
    expect(synced.server_scan_id).toBe('server_scan_999');
    expect(synced.tx_hash).toBe('0xabc123def456');
    expect(synced.synced_at).toBeDefined();

    // Verify it is no longer returned in getPendingScans
    const pending = await getPendingScans('user_1');
    expect(pending.find(p => p.id === saved.id)).toBeUndefined();
  });

  it('6. Deletes an offline scan by ID', async () => {
    const saved = await saveOfflineScan({ vision_diagnosis: 'Grape Black Rot' }, 'user_1');
    const deleted = await deleteOfflineScan(saved.id);
    expect(deleted).toBe(true);

    const all = await getAllOfflineScans('user_1');
    expect(all.find(p => p.id === saved.id)).toBeUndefined();
  });

  it('7. Sync Engine respects offline state and aborts without network calls', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    await saveOfflineScan({ vision_diagnosis: 'Tomato Late Blight' }, 'user_1');

    const result = await syncPendingScans({ token: 'mock_token' });
    expect(result.success).toBe(false);
    expect(result.reason).toBe('OFFLINE');
    expect(result.syncedCount).toBe(0);
  });

  it('8. Sync Engine synchronizes pending scans when online and marks them SYNCED', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    const saved = await saveOfflineScan({
      vision_diagnosis: 'Tomato Late Blight',
      proposed_chemical: 'Mancozeb 75% WP',
      safe_dosage_ml_per_acre: 150
    }, 'user_1');

    // Mock fetch for sync endpoint
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'server_mongo_id_888',
        tx_hash: '0x1234567890abcdef'
      })
    });

    const result = await syncPendingScans({ token: 'mock_jwt_token', userId: 'user_1' });
    expect(result.success).toBe(true);
    expect(result.syncedCount).toBe(1);

    const pendingAfter = await getPendingScans('user_1');
    expect(pendingAfter.length).toBe(0);
  });

  it('9. Gracefully handles unsupported IndexedDB without throwing exceptions', async () => {
    window.indexedDB = null;
    const db = await openDB();
    expect(db).toBeNull();

    const saved = await saveOfflineScan({ vision_diagnosis: 'Fallback' });
    expect(saved).toBeNull();

    const pending = await getPendingScans();
    expect(pending).toEqual([]);
  });
});
