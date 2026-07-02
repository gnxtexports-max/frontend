import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";
import axios from "axios";
import { io } from "socket.io-client";
import {
  initDb,
  getCache,
  setCache,
  addToSyncQueue,
  optimisticUpdate,
  invalidateCachePrefix,
  clearApiCache
} from "./app/utils/db";

// Detect page reload/refresh using Navigation API and clear API cache
const isReload = window.performance && window.performance.getEntriesByType("navigation")[0]?.type === "reload";
if (isReload) {
  clearApiCache()
    .then(() => console.log("[IndexedDB] Reload detected, API cache cleared."))
    .catch((err) => console.error("[IndexedDB] Error clearing API cache:", err));
}

// Initialize IndexedDB on bootstrap
initDb()
  .then(() => console.log("[Bootstrap] IndexedDB initialized."))
  .catch((err) => console.error("[Bootstrap] IndexedDB init failed:", err));

// Service Worker disabled during development to prevent stale cache issues.
// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/sw.js")
//       .then((reg) => console.log("[Service Worker] Registered with scope:", reg.scope))
//       .catch((err) => console.error("[Service Worker] Registration failed:", err));
//   });
// }

// ── Socket.io connection ────────────────────────────────
const _rawApi = (import.meta.env?.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "").replace("backend-46iu.onrender.com", "gnxt-backend.onrender.com").replace("backend-zm55.onrender.com", "gnxt-backend.onrender.com");
const API_BASE_URL = _rawApi.endsWith("/api") ? _rawApi : _rawApi + "/api";
const SOCKET_URL = API_BASE_URL.endsWith("/api") ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  autoConnect: true,
});

// Global cache-busting version — bumped on every invalidation so the GET handler
// can skip stale IndexedDB entries even if deletion is still in-flight.
window.__cacheVersion = Date.now();

// Fallback: global 7-min poll in case socket ever drops silently
setInterval(() => {
  window.dispatchEvent(new CustomEvent("api-cache-updated"));
}, 420_000);

socket.on("connect", () => console.log("[Socket] Connected:", socket.id));
socket.on("disconnect", () => console.log("[Socket] Disconnected"));

socket.on("reconnect", async () => {
  console.log("[Socket] Reconnected — refreshing all data");
  window.__cacheVersion = Date.now();
  window.dispatchEvent(new CustomEvent("api-cache-updated"));
});

function bustCache() {
  window.__cacheVersion = Date.now();
}

socket.on("shipments:changed", async () => {
  console.log("[Socket] shipments:changed — invalidating cache");
  await invalidateCachePrefix("shipments");
  await invalidateCachePrefix("dashboard");
  await invalidateCachePrefix("vehicles");
  await invalidateCachePrefix("drivers");
  await invalidateCachePrefix("invoices");
  bustCache();
  window.dispatchEvent(new CustomEvent("api-cache-updated"));
});

socket.on("invoices:changed", async () => {
  console.log("[Socket] invoices:changed — invalidating cache");
  await invalidateCachePrefix("invoices");
  bustCache();
  window.dispatchEvent(new CustomEvent("api-cache-updated"));
});

socket.on("expenses:changed", async () => {
  console.log("[Socket] expenses:changed — invalidating cache");
  await invalidateCachePrefix("expenses");
  bustCache();
  window.dispatchEvent(new CustomEvent("api-cache-updated"));
});

socket.on("vehicles:changed", async () => {
  console.log("[Socket] vehicles:changed — invalidating cache");
  await invalidateCachePrefix("vehicles");
  await invalidateCachePrefix("dashboard");
  bustCache();
  window.dispatchEvent(new CustomEvent("api-cache-updated"));
});

socket.on("drivers:changed", async () => {
  console.log("[Socket] drivers:changed — invalidating cache");
  await invalidateCachePrefix("drivers");
  bustCache();
  window.dispatchEvent(new CustomEvent("api-cache-updated"));
});

// Helper to determine sync/action name for queue display
function getActionName(method, url) {
  const lowercaseUrl = url.toLowerCase();
  let action = "Modify Record";

  if (method === "POST") action = "Create Record";
  else if (method === "DELETE") action = "Delete Record";
  else if (method === "PUT" || method === "PATCH") action = "Update Record";

  if (lowercaseUrl.includes("/shipments")) {
    if (lowercaseUrl.includes("/status")) return "Update Shipment Status";
    return method === "POST" ? "Create Shipment" : method === "DELETE" ? "Delete Shipment" : "Update Shipment";
  } else if (lowercaseUrl.includes("/expenses")) {
    return method === "POST" ? "Add Expense" : method === "DELETE" ? "Delete Expense" : "Update Expense";
  } else if (lowercaseUrl.includes("/invoices")) {
    if (lowercaseUrl.includes("/upload")) return "Upload Invoice Sheet";
    return method === "POST" ? "Add Invoice" : "Update Invoice";
  } else if (lowercaseUrl.includes("/vehicles")) {
    return "Update Vehicle Status";
  } else if (lowercaseUrl.includes("/drivers")) {
    return "Update Driver Status";
  }
  return action;
}

// Save the original fetch to bypass interceptor when fetching from network
const originalFetch = window.fetch;

// Patch window.fetch globally to handle local caching, queueing, and hybrid synchronizations
window.fetch = async (url, options = {}) => {
  let urlString = url.toString();
  const method = options.method?.toUpperCase() || "GET";

  // Rewrite old backend URL to new one (fixes Vercel env var override)
  urlString = urlString.replace("https://backend-46iu.onrender.com", "https://gnxt-backend.onrender.com").replace("https://backend-zm55.onrender.com", "https://gnxt-backend.onrender.com");
  if (urlString !== url.toString()) url = urlString;

  // Bypass interceptor if:
  // - It's not an API call (e.g. static files, bundle scripts)
  // - The special bypass header "X-Bypass-Offline" is set (used during sync queues)
  const isApi = urlString.includes("/api/") || urlString.includes("localhost:5000") || urlString.includes("127.0.0.1:5000");

  // Add credentials for session cookie
  if (isApi) {
    options.credentials = "include";
  }
  const hasBypass = options.headers && (
    (options.headers instanceof Headers && options.headers.has("X-Bypass-Offline")) ||
    (options.headers["X-Bypass-Offline"] !== undefined)
  );

  if (!isApi || hasBypass) {
    // Clean bypass header if present
    if (options.headers && !(options.headers instanceof Headers)) {
      delete options.headers["X-Bypass-Offline"];
    }
    return originalFetch(url, options);
  }

  // Handle GET Requests — Network-First Strategy
  if (method === "GET") {
    if (navigator.onLine) {
      try {
        const response = await originalFetch(url, options);
        if (response.status === 401 && !urlString.includes("/auth/me") && !urlString.includes("/auth/login")) {
          localStorage.removeItem("gnxt_user");
          window.dispatchEvent(new CustomEvent("unauthorized-access"));
        }
        if (response.ok) {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const clone = response.clone();
            const json = await clone.json();
            json._cachedAt = Date.now();
            await setCache(urlString, json);
          }
          return response;
        }
        return response;
      } catch (err) {
        console.warn("[Fetch Interceptor] GET network failed, trying cache:", urlString);
        // Fallback to cache if network request throws (e.g. server unreachable while online)
        const cachedFallback = await getCache(urlString);
        if (cachedFallback) {
          return new Response(JSON.stringify(cachedFallback), {
            status: 200,
            statusText: "OK",
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    } else {
      // Offline mode: Serve from IndexedDB
      console.log("[Fetch Interceptor] Offline mode, serving GET cache:", urlString);
      const cachedOffline = await getCache(urlString);
      if (cachedOffline) {
        return new Response(JSON.stringify(cachedOffline), {
          status: 200,
          statusText: "OK",
          headers: { "Content-Type": "application/json" }
        });
      }
    }

      // Safe fallbacks for lists/views to prevent blank screen crashes
      let fallbackData = [];
      if (urlString.includes("/shipments/next-id")) {
        const year = new Date().getFullYear();
        fallbackData = { success: true, data: { nextShipmentId: `SHP-${year}-OFFLINE-${Date.now().toString().slice(-4)}`, lrPrefix: `LR-${year}-OFFLINE`, sequence: 9999 } };
      } else if (urlString.includes("/shipments/plant-numbers")) {
        fallbackData = { success: true, data: [] };
      } else if (urlString.includes("/invoices") || urlString.includes("/expenses") || urlString.includes("/shipments") || urlString.includes("/vehicles") || urlString.includes("/drivers")) {
        fallbackData = { success: true, data: [], pagination: { total: 0, page: 1, limit: 15, totalPages: 1 } };
      } else {
        fallbackData = { success: false, message: "Offline: Resource not cached." };
      }

      return new Response(JSON.stringify(fallbackData), {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "application/json" }
      });
  }

  // Handle Write Requests (POST, PUT, PATCH, DELETE)
  if (navigator.onLine) {
    try {
      const response = await originalFetch(url, options);
      if (response.status === 401 && !urlString.includes("/auth/me") && !urlString.includes("/auth/login")) {
        localStorage.removeItem("gnxt_user");
        window.dispatchEvent(new CustomEvent("unauthorized-access"));
      }
      if (response.ok) {
        // Clear caches of the corresponding module to ensure lists re-fetch fresh database updates
        let moduleKey = "";
        const extraKeys = [];
        if (urlString.includes("/shipments")) {
          moduleKey = "shipments";
          extraKeys.push("vehicles", "drivers", "invoices", "dashboard");
        } else if (urlString.includes("/expenses")) {
          moduleKey = "expenses";
          extraKeys.push("dashboard");
        } else if (urlString.includes("/invoices")) {
          moduleKey = "invoices";
          extraKeys.push("dashboard");
        } else if (urlString.includes("/vehicles")) {
          moduleKey = "vehicles";
          extraKeys.push("shipments", "dashboard");
        } else if (urlString.includes("/drivers")) {
          moduleKey = "drivers";
          extraKeys.push("shipments", "dashboard");
        }

        if (moduleKey) {
          await invalidateCachePrefix(moduleKey);
        }
        for (const key of extraKeys) {
          await invalidateCachePrefix(key);
        }
        bustCache();
        // Dispatch event so UI can refresh silently
        window.dispatchEvent(new CustomEvent("api-cache-updated"));
      }
      return response;
    } catch (err) {
      console.warn("[Fetch Interceptor] Write network failed, queuing operation:", urlString);
      // DO NOT queue authentication requests
      if (urlString.includes("/auth/")) {
        return new Response(JSON.stringify({ success: false, message: "Network error: Unable to reach the server." }), {
          status: 503,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  }

  // Offline Mode (or dropped network): Queue the request and perform an optimistic update on local caches
  // DO NOT queue authentication requests
  if (urlString.includes("/auth/")) {
    return new Response(JSON.stringify({ success: false, message: "Network error: Unable to reach the authentication server." }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }

  console.log(`[Fetch Interceptor] Offline mode: queueing ${method} for ${urlString}`);

  let reqBody = options.body;
  if (reqBody instanceof FormData) {
    reqBody = {};
    for (const [key, value] of reqBody.entries()) {
      reqBody[key] = value;
    }
  }

  const actionName = getActionName(method, urlString);

  // Store in write sync queue
  await addToSyncQueue({
    url: urlString,
    method,
    body: reqBody,
    headers: options.headers || {},
    actionName
  });

  // Optimistically update the cached lists immediately in IndexedDB so UI changes persist and render
  await optimisticUpdate(method, urlString, reqBody);

  // Return a simulated successful response so UI form sheets close and redirect
  const mockResponse = {
    success: true,
    message: "Operation saved locally. GNXT will sync automatically when connection is restored.",
    data: typeof reqBody === "string" ? JSON.parse(reqBody) : reqBody
  };

  // Dispatch a custom event to notify components that queue size has changed
  window.dispatchEvent(new CustomEvent("sync-queue-updated"));

  return new Response(JSON.stringify(mockResponse), {
    status: 200,
    statusText: "OK",
    headers: { "Content-Type": "application/json" }
  });
};

// Patch Axios globally to use the patched window.fetch as its under-the-hood adapter.
axios.defaults.adapter = async function fetchAdapter(config) {
  const url = axios.getUri(config);

  // Format headers to standard object
  const headers = {};
  if (config.headers) {
    Object.keys(config.headers).forEach((key) => {
      headers[key] = config.headers[key];
    });
  }

  let body = config.data;
  if (body && typeof body === "object") {
    body = JSON.stringify(body);
  }

  const options = {
    method: config.method?.toUpperCase() || "GET",
    headers,
    body,
    mode: "cors",
    credentials: "include",
  };

  try {
    const response = await window.fetch(url, options);
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    const axiosResponse = {
      data: data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config,
      request: null
    };

    if (!response.ok) {
      const error = new Error(`Request failed with status code ${response.status}`);
      error.response = axiosResponse;
      error.config = config;
      return Promise.reject(error);
    }

    return axiosResponse;
  } catch (err) {
    const error = new Error(err.message || "Network Error");
    error.config = config;
    error.request = null;
    return Promise.reject(error);
  }
};

createRoot(document.getElementById("root")).render(<App />);
