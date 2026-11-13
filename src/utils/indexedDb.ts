/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - IndexedDB Offline-First Storage Engine
 * Official Slogan: Digital Health Locker for Citizens
 */

const DB_NAME = 'swasthya_wallet_vault_db';
const DB_VERSION = 2;

export interface StoredRecord {
  id: string;
  data: any;
  updatedAt: number;
  syncState: 'synced' | 'pending' | 'failed';
  version: number;
}

export interface SyncQueueItem {
  id: string;
  action: 'insert' | 'update' | 'delete';
  collection: 'records' | 'prescriptions' | 'reports';
  payload: any;
  timestamp: number;
  attempts: number;
}

export interface LocalStorageStats {
  recordsCount: number;
  prescriptionsCount: number;
  reportsCount: number;
  pendingSyncCount: number;
  databaseSizeBytes: number;
  lastLocalSaveTimestamp: number | null;
}

class IndexedDBVault {
  private db: IDBDatabase | null = null;
  private isReadyPromise: Promise<IDBDatabase | null>;
  private memoryFallback: Map<string, any> = new Map();
  private memoryQueue: SyncQueueItem[] = [];

  constructor() {
    this.isReadyPromise = this.init();
  }

  private init(): Promise<IDBDatabase | null> {
    return new Promise<IDBDatabase | null>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        resolve(null);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Health Records Store
        if (!db.objectStoreNames.contains('health_records')) {
          const recStore = db.createObjectStore('health_records', { keyPath: 'id' });
          recStore.createIndex('syncState', 'syncState', { unique: false });
          recStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Prescriptions Store
        if (!db.objectStoreNames.contains('prescriptions')) {
          const presStore = db.createObjectStore('prescriptions', { keyPath: 'id' });
          presStore.createIndex('system', 'system', { unique: false });
          presStore.createIndex('syncState', 'syncState', { unique: false });
        }

        // Medical Reports Store
        if (!db.objectStoreNames.contains('medical_reports')) {
          db.createObjectStore('medical_reports', { keyPath: 'id' });
        }

        // Offline Sync Action Queue Store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Medicines Local Cache
        if (!db.objectStoreNames.contains('medicine_cache')) {
          db.createObjectStore('medicine_cache', { keyPath: 'id' });
        }

        // Storage Metadata Store
        if (!db.objectStoreNames.contains('vault_metadata')) {
          db.createObjectStore('vault_metadata', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB'));
      };
    });
  }

  private async getDB(): Promise<IDBDatabase | null> {
    if (this.db) return this.db;
    return this.isReadyPromise;
  }

  async saveHealthRecord(record: any, syncState: 'synced' | 'pending' | 'failed' = 'synced'): Promise<void> {
    const db = await this.getDB();
    if (!db) {
      this.memoryFallback.set(record.id, {
        id: record.id,
        data: record,
        updatedAt: Date.now(),
        syncState,
        version: (record.version || 0) + 1,
      });
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('health_records', 'readwrite');
      const store = tx.objectStore('health_records');
      const item: StoredRecord = {
        id: record.id,
        data: record,
        updatedAt: Date.now(),
        syncState,
        version: (record.version || 0) + 1,
      };
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getHealthRecords(): Promise<any[]> {
    const db = await this.getDB();
    if (!db) {
      return Array.from(this.memoryFallback.values()).map((item: any) => item.data);
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('health_records', 'readonly');
      const store = tx.objectStore('health_records');
      const req = store.getAll();
      req.onsuccess = () => {
        const records = (req.result || []).map((item: StoredRecord) => item.data);
        resolve(records);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteHealthRecord(id: string): Promise<void> {
    const db = await this.getDB();
    if (!db) {
      this.memoryFallback.delete(id);
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('health_records', 'readwrite');
      const store = tx.objectStore('health_records');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async savePrescription(prescription: any, syncState: 'synced' | 'pending' = 'pending'): Promise<void> {
    const db = await this.getDB();
    if (!db) {
      this.memoryFallback.set(`rx_${prescription.id}`, {
        id: prescription.id,
        data: prescription,
        system: prescription.medicalSystem,
        syncState,
        updatedAt: Date.now(),
      });
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('prescriptions', 'readwrite');
      const store = tx.objectStore('prescriptions');
      const item = {
        id: prescription.id,
        data: prescription,
        system: prescription.medicalSystem,
        syncState,
        updatedAt: Date.now(),
      };
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getPrescriptions(): Promise<any[]> {
    const db = await this.getDB();
    if (!db) {
      return Array.from(this.memoryFallback.values())
        .filter((item: any) => item.id.startsWith('rx_') || item.system)
        .map((item: any) => item.data);
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('prescriptions', 'readonly');
      const store = tx.objectStore('prescriptions');
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result || []).map((item: any) => item.data);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async enqueueSyncAction(action: 'insert' | 'update' | 'delete', collection: 'records' | 'prescriptions' | 'reports', payload: any): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      action,
      collection,
      payload,
      timestamp: Date.now(),
      attempts: 0,
    };
    const db = await this.getDB();
    if (!db) {
      this.memoryQueue.push(queueItem);
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const req = store.put(queueItem);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getPendingSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.getDB();
    if (!db) {
      return [...this.memoryQueue];
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async clearSyncQueueItem(id: string): Promise<void> {
    const db = await this.getDB();
    if (!db) {
      this.memoryQueue = this.memoryQueue.filter((q) => q.id !== id);
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getStorageStats(): Promise<LocalStorageStats> {
    try {
      const db = await this.getDB();
      if (!db) {
        return {
          recordsCount: this.memoryFallback.size,
          prescriptionsCount: 0,
          reportsCount: 0,
          pendingSyncCount: this.memoryQueue.length,
          databaseSizeBytes: 240000 + this.memoryFallback.size * 12000,
          lastLocalSaveTimestamp: Date.now(),
        };
      }
      const recordsCount = await this.countStore(db, 'health_records');
      const prescriptionsCount = await this.countStore(db, 'prescriptions');
      const reportsCount = await this.countStore(db, 'medical_reports');
      const pendingSyncCount = await this.countStore(db, 'sync_queue');

      // Estimate storage estimation API if available
      let databaseSizeBytes = 450000 + recordsCount * 12000;
      if (navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          if (estimate.usage) databaseSizeBytes = estimate.usage;
        } catch {
          // ignore
        }
      }

      return {
        recordsCount,
        prescriptionsCount,
        reportsCount,
        pendingSyncCount,
        databaseSizeBytes,
        lastLocalSaveTimestamp: Date.now(),
      };
    } catch {
      return {
        recordsCount: 0,
        prescriptionsCount: 0,
        reportsCount: 0,
        pendingSyncCount: 0,
        databaseSizeBytes: 0,
        lastLocalSaveTimestamp: null,
      };
    }
  }

  private countStore(db: IDBDatabase, storeName: string): Promise<number> {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
  }
}

export const localVaultDB = new IndexedDBVault();
