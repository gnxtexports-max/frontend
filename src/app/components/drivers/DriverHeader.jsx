import { Users, Plus, TrendingUp } from "lucide-react";
import { Button } from "../ui/button";

export function DriverHeader({ drivers, onAddDriverClick }) {
  const activeDrivers = drivers.filter((d) => d.tripStatus === "Driving").length;
  const ownDrivers = drivers.filter((d) => d.driverType === "Own").length;
  const hiredDrivers = drivers.filter((d) => d.driverType === "Hired").length;

  return (
    <div className="px-6 pt-6 pb-4 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-foreground tracking-tight flex items-center gap-2.5 text-2xl font-bold">
            <Users className="w-6 h-6 text-[#1d4ed8]" />
            Driver Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage all drivers across your fleet
          </p>
        </div>
        <Button
          onClick={onAddDriverClick}
          className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white gap-2 h-9 px-4 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Driver
        </Button>
      </div>

      {/* Summary Pills */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-xs">
          <Users className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">Total Drivers:</span>
          <span className="text-foreground font-semibold">{drivers.length}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-xs">
          <TrendingUp className="w-3 h-3 text-emerald-600" />
          <span className="text-muted-foreground">Active (Driving):</span>
          <span className="text-foreground font-semibold">{activeDrivers}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-xs">
          <Users className="w-3 h-3 text-blue-600" />
          <span className="text-muted-foreground">Own Drivers:</span>
          <span className="text-foreground font-semibold">{ownDrivers}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-xs">
          <Users className="w-3 h-3 text-purple-600" />
          <span className="text-muted-foreground">Hired Drivers:</span>
          <span className="text-foreground font-semibold">{hiredDrivers}</span>
        </div>
      </div>
    </div>
  );
}

export default DriverHeader;