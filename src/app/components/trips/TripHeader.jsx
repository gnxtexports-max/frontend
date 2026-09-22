import { useState } from "react";
import { Locate, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

export function TripHeader({ totalVehicles, onRefresh, loading }) {
  const [syncTime, setSyncTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
      setSyncTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1d4ed8] flex items-center justify-center shadow-sm">
          <Locate className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Fleet Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fleet monitoring &middot; {totalVehicles} vehicle{totalVehicles !== 1 ? "s" : ""} tracked &middot; Last synced {syncTime}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
          className="gap-2 border-border text-muted-foreground hover:text-foreground h-9 px-3.5 text-xs font-medium shadow-sm bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#1d4ed8]" : ""}`} />
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
    </div>
  );
}
export default TripHeader;
