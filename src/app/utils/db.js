// IndexedDB helper utility for offline data caching and write synchronization queue.
const DB_NAME = "gnxt_hybrid_db";
const DB_VERSION = 1;

let dbInstance = null;

export function initDb() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store 1: cache GET response data
      if (!db.objectStoreNames.contains("api-cache")) {
        db.createObjectStore("api-cache", { keyPath: "key" });
      }

      // Store 2: queue write operations (POST, PUT, DELETE) to sync when online
      if (!db.objectStoreNames.contains("sync-queue")) {
        db.createObjectStore("sync-queue", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      console.log("[IndexedDB] Database initialized successfully.");
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error("[IndexedDB] Initialization error:", event.target.error);
      reject(event.target.error);
    };
  });
}

// ────────────────────────────────────────────────────────────────────────
// API Cache Operations (GET requests)
// ────────────────────────────────────────────────────────────────────────

export async function getCache(key) {
  const db = await initDb();
  return new Promise((resolve) => {
    const tx = db.transaction("api-cache", "readonly");
    const store = tx.objectStore("api-cache");
    const request = store.get(key);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.data);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      resolve(null);
    };
  });
}

export async function setCache(key, data) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("api-cache", "readwrite");
    const store = tx.objectStore("api-cache");
    const request = store.put({
      key,
      data,
      timestamp: Date.now()
    });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.onerror);
  });
}

// Invalidate caches matching certain module keywords (e.g. shipments, expenses, invoices)
export async function invalidateCachePrefix(prefix) {
  const db = await initDb();
  return new Promise((resolve) => {
    const tx = db.transaction("api-cache", "readwrite");
    const store = tx.objectStore("api-cache");
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        // If key contains the prefix (e.g. "shipments" or "expenses"), delete it
        if (cursor.key.toLowerCase().includes(prefix.toLowerCase())) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
      }
    };

    request.onerror = () => {
      resolve();
    };
  });
}

// ────────────────────────────────────────────────────────────────────────
// Write Queue Operations (POST, PUT, DELETE requests)
// ────────────────────────────────────────────────────────────────────────

export async function addToSyncQueue(reqData) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sync-queue", "readwrite");
    const store = tx.objectStore("sync-queue");
    const request = store.add({
      url: reqData.url,
      method: reqData.method || "POST",
      body: reqData.body || null,
      headers: reqData.headers || {},
      timestamp: Date.now(),
      actionName: reqData.actionName || "Pending Operation"
    });

    request.onsuccess = (event) => {
      console.log(`[IndexedDB] Added operation to sync queue: ${reqData.method} ${reqData.url}`);
      resolve(event.target.result); // Returns the generated ID
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getSyncQueue() {
  const db = await initDb();
  return new Promise((resolve) => {
    const tx = db.transaction("sync-queue", "readonly");
    const store = tx.objectStore("sync-queue");
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by timestamp just in case
      const list = request.result || [];
      list.sort((a, b) => a.timestamp - b.timestamp);
      resolve(list);
    };

    request.onerror = () => {
      resolve([]);
    };
  });
}

export async function deleteFromSyncQueue(id) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sync-queue", "readwrite");
    const store = tx.objectStore("sync-queue");
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log(`[IndexedDB] Removed item ${id} from sync queue.`);
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ────────────────────────────────────────────────────────────────────────
// Optimistic Updates for local lists (so changes appear in the tables instantly offline)
// ────────────────────────────────────────────────────────────────────────

export async function optimisticUpdate(method, url, body) {
  try {
    const parsedBody = typeof body === "string" ? JSON.parse(body) : body;
    if (!parsedBody) return;

    // Detect which module is affected
    let moduleKey = "";
    if (url.includes("/shipments")) moduleKey = "shipments";
    else if (url.includes("/expenses")) moduleKey = "expenses";
    else if (url.includes("/invoices")) moduleKey = "invoices";
    else if (url.includes("/vehicles")) moduleKey = "vehicles";
    else if (url.includes("/drivers")) moduleKey = "drivers";

    if (!moduleKey) return;

    // We search our api-cache to find any cached GET request that corresponds to this module list
    const db = await initDb();
    const tx = db.transaction("api-cache", "readwrite");
    const store = tx.objectStore("api-cache");
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const key = cursor.key;
        // Check if this cached key represents the main GET list of the module
        if (key.includes(`/api/${moduleKey}`) && !key.includes("/next-id") && !key.includes("/plant-numbers")) {
          const entry = cursor.value;
          let list = [];
          let isStructured = false;

          // Check format of cached GET payload. Usually it's either an array or { success: true, data: [...] }
          if (Array.isArray(entry.data)) {
            list = [...entry.data];
          } else if (entry.data && Array.isArray(entry.data.data)) {
            list = [...entry.data.data];
            isStructured = true;
          } else if (entry.data && entry.data.success && Array.isArray(entry.data.data)) {
            list = [...entry.data.data];
            isStructured = true;
          }

          if (list) {
            if (method === "POST") {
              // Create temporary local record
              const newRecord = {
                _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...parsedBody
              };

              // Customize default values based on module schema
              if (moduleKey === "shipments") {
                newRecord.shipmentId = `SHP-TEMP-${Date.now().toString().slice(-4)}`;
                newRecord.status = "Pending";
                newRecord.totalWeightKg = (newRecord.destinations || []).reduce((acc, d) => acc + (parseFloat(d.weightKg) || 0), 0);
                newRecord.totalQuantity = (newRecord.destinations || []).reduce((acc, d) => acc + (parseInt(d.totalTyres) || 0) + (parseInt(d.totalTubes) || 0) + (parseInt(d.totalFlaps) || 0), 0);
              } else if (moduleKey === "expenses") {
                newRecord.status = "Pending";
              }

              list.unshift(newRecord);
            } else if (method === "PUT" || method === "PATCH") {
              // Extract ID from URL (e.g. /api/shipments/12345)
              const urlParts = url.split("/");
              const id = urlParts[urlParts.length - 1];

              // Update item in list
              list = list.map(item => {
                if (item._id === id || item.shipmentId === id) {
                  const updatedItem = { ...item, ...parsedBody, updatedAt: new Date().toISOString() };
                  if (moduleKey === "vehicles" && parsedBody.status !== undefined) {
                    if (parsedBody.status === "Maintenance") {
                      updatedItem.availability = "Unavailable";
                    } else if (parsedBody.status === "Idle") {
                      updatedItem.availability = "Available";
                    }
                  }
                  return updatedItem;
                }
                return item;
              });
            } else if (method === "DELETE") {
              const urlParts = url.split("/");
              const id = urlParts[urlParts.length - 1];
              list = list.filter(item => item._id !== id && item.shipmentId !== id);
            }

            // Save back modified list
            if (isStructured) {
              entry.data.data = list;
              if (entry.data.pagination) {
                entry.data.pagination.total = list.length;
              }
            } else {
              entry.data = list;
            }

            cursor.update(entry);
            console.log(`[IndexedDB] Optimistically updated local list cache for: ${key}`);
          }
        }
        cursor.continue();
      }
    };
  } catch (err) {
    console.error("[IndexedDB] Error applying optimistic update:", err);
  }
}

export async function clearApiCache() {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("api-cache", "readwrite");
    const store = tx.objectStore("api-cache");
    const request = store.clear();
    request.onsuccess = () => {
      console.log("[IndexedDB] api-cache cleared.");
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}
