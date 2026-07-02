import { Truck, Plus } from "lucide-react";
import { Button } from "../ui/button";

export default function VehicleHeader({
  totalActive,
  totalIdle,
  totalMaintenance,
  totalVehicles,
  onAddVehicleClick,
}) {
  return (
    <div className="px-6 pt-6 pb-4 shrink-0">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-foreground tracking-tight flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-[#1d4ed8]" />
            Vehicle Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track and manage all vehicles in your fleet
          </p>
        </div>
        <Button
          className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white gap-2 h-9 px-4 text-sm"
          onClick={onAddVehicleClick}
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Summary pills */}
      <div className="flex items-center gap-3 mt-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Active / In Transit:</span>
          <span className="text-foreground">{totalActive}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-xs">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-muted-foreground">Idle:</span>
          <span className="text-foreground">{totalIdle}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-xs">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">
            Maintenance / Breakdown:
          </span>
          <span className="text-foreground">{totalMaintenance}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-xs">
          <Truck className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">Total Fleet:</span>
          <span className="text-foreground">{totalVehicles}</span>
        </div>
      </div>
    </div>
  );
}
