import { Locate, Radio, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

export function TripHeader({ totalVehicles }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1d4ed8] flex items-center justify-center shadow-sm">
          <Locate className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-foreground tracking-tight">
            Fleet Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fleet monitoring &middot; {totalVehicles} vehicles tracked &middot; Last synced 11:45 AM
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="gap-2 border-border text-muted-foreground hover:text-foreground h-9"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
export default TripHeader;
