import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSyncQueue, deleteFromSyncQueue, invalidateCachePrefix } from "../utils/db";
import { toast } from "sonner";

const OfflineSyncContext = createContext({
  isOnline: true,
  isSyncing: false,
  pendingSyncCount: 0,
  triggerSync: () => Promise.resolve()
});

export function OfflineSyncProvider({ children }) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Helper to count pending queue items
  const updatePendingCount = useCallback(async () => {
    try {
      const queue = await getSyncQueue();
      setPendingSyncCount(queue.length);
      return queue.length;
    } catch (err) {
      console.error("[SyncContext] Error reading queue:", err);
      return 0;
    }
  }, []);

  // Main sync function that pushes offline changes to the cloud
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    const queue = await getSyncQueue();
    if (queue.length === 0) {
      setPendingSyncCount(0);
      return;
    }

    setIsSyncing(true);
    const syncToastId = toast.loading(`Syncing ${queue.length} offline change(s)...`, {
      description: "Pushing your local database changes to the cloud.",
    });

    let successCount = 0;
    let failedCount = 0;

    try {
      for (const item of queue) {
        // Prepare headers & token
        const headers = {
          ...item.headers,
          "Content-Type": "application/json",
          "X-Bypass-Offline": "true" // Signal to fetch interceptor to send to network
        };

        const fetchOptions = {
          method: item.method,
          headers,
          credentials: "include",
        };

        if (item.body && (item.method === "POST" || item.method === "PUT" || item.method === "PATCH")) {
          // If body contains temporary local IDs like temp_123, we can strip or send them.
          // The backend ignores unrecognized fields or handles them natively.
          fetchOptions.body = typeof item.body === "string" ? item.body : JSON.stringify(item.body);
        }

        try {
          const response = await window.fetch(item.url, fetchOptions);
          
          if (response.ok) {
            // Successfully processed on backend
            await deleteFromSyncQueue(item.id);
            successCount++;

            // Invalidate corresponding get cache prefix to trigger fresh list fetches
            let moduleKey = "";
            if (item.url.includes("/shipments")) moduleKey = "shipments";
            else if (item.url.includes("/expenses")) moduleKey = "expenses";
            else if (item.url.includes("/invoices")) moduleKey = "invoices";
            else if (item.url.includes("/vehicles")) moduleKey = "vehicles";
            else if (item.url.includes("/drivers")) moduleKey = "drivers";
            
            if (moduleKey) {
              await invalidateCachePrefix(moduleKey);
            }
          } else {
            const errData = await response.json().catch(() => ({}));
            console.error(`[SyncContext] Sync failed for item ${item.id} with status ${response.status}:`, errData);
            
            // If it's a user/validation error (e.g. 400 Bad Request, 403 Forbidden, 404 Not Found),
            // remove it from the queue so it doesn't block future syncs, and alert the user.
            if (response.status >= 400 && response.status < 500) {
              await deleteFromSyncQueue(item.id);
              failedCount++;
              toast.error(`Sync warning: ${errData.message || "Invalid operation details."}`, {
                description: `Operation: ${item.actionName} skipped.`,
                duration: 6000
              });
            } else {
              // Server-side database down or gateway issue (500+), stop sync loop to retry later
              throw new Error("Server error, stopping sync loop.");
            }
          }
        } catch (err) {
          console.error(`[SyncContext] Network error syncing item ${item.id}:`, err);
          // Network failed mid-sync (user went offline again or API server dropped connection)
          break;
        }

        // Keep local UI count updated during sync
        await updatePendingCount();
      }
    } catch (err) {
      console.error("[SyncContext] Error running sync queue:", err);
    } finally {
      setIsSyncing(false);
      const remaining = await updatePendingCount();

      // Update toast UI with sync outcomes
      if (successCount > 0) {
        toast.success("Synchronization complete!", {
          id: syncToastId,
          description: `Successfully pushed ${successCount} local change(s) to MongoDB Atlas.`,
          duration: 4000
        });

        // Trigger global list refetch by dispatching a custom event
        window.dispatchEvent(new CustomEvent("sync-complete"));
      } else if (failedCount > 0) {
        toast.warning("Sync finished with warnings.", {
          id: syncToastId,
          description: "Some offline actions failed validations and were discarded.",
          duration: 5000
        });
      } else {
        // No success but sync finished (could have hit network failures)
        toast.dismiss(syncToastId);
      }
    }
  }, [isSyncing, updatePendingCount]);

  // Set up connection event listeners and initialization
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back Online!", {
        description: "Reconnected to GNXT Cloud Services.",
        duration: 3000
      });
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Working Offline (Cache Mode)", {
        description: "Changes are saved to IndexedDB and will sync when online.",
        duration: 5000
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    updatePendingCount().then((count) => {
      if (count > 0 && navigator.onLine) {
        triggerSync();
      }
    });

    // Check sync status every 45 seconds as background retry fallback
    const interval = setInterval(() => {
      if (navigator.onLine) {
        triggerSync();
      }
    }, 45000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [triggerSync, updatePendingCount]);

  return (
    <OfflineSyncContext.Provider value={{ isOnline, isSyncing, pendingSyncCount, triggerSync }}>
      {children}
    </OfflineSyncContext.Provider>
  );
}

export const useOfflineSync = () => useContext(OfflineSyncContext);
