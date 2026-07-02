import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { OfflineSyncProvider } from "./context/OfflineSyncContext";
import { BackendHealthProvider } from "./context/BackendHealthContext";
import { useKeepAlive } from "./utils/useKeepAlive";

export default function App() {
  console.log("[App] Root App component rendered");
  useKeepAlive();

  return (
    <AuthProvider>
      <OfflineSyncProvider>
        <BackendHealthProvider>
          <RouterProvider router={router} />
        </BackendHealthProvider>
      </OfflineSyncProvider>
    </AuthProvider>
  );
}
