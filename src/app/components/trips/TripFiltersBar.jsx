import { Search, Truck, Filter } from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function TripFiltersBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  vehicleTypeFilter,
  setVehicleTypeFilter,
  showNotDispatched,
  setShowNotDispatched,
  filteredVehicles,
  statusCounts,
  vehicles = [],
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[280px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by Vehicle, Driver, Shipment ID, Dealer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 bg-white border-border"
        />
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[190px] h-9 bg-white border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <SelectValue placeholder="Active Trips" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active Trips ({statusCounts.all - (statusCounts.Idle || 0)})</SelectItem>
          <SelectItem value="all">All Statuses ({statusCounts.all})</SelectItem>
          <SelectItem value="In Transit">In Transit ({statusCounts["In Transit"] || 0})</SelectItem>
          <SelectItem value="Waiting for Dispatch">Waiting for Dispatch ({statusCounts["Waiting for Dispatch"] || 0})</SelectItem>
          <SelectItem value="Idle">Idle Fleet ({statusCounts.Idle || 0})</SelectItem>
        </SelectContent>
      </Select>

      <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
        <SelectTrigger className="w-[155px] h-9 bg-white border-border">
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-muted-foreground" />
            <SelectValue placeholder="Vehicle Type" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="Own">Own Vehicles</SelectItem>
          <SelectItem value="Rented">Rented Vehicles</SelectItem>
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="dispatch-filter"
            checked={showNotDispatched}
            onCheckedChange={setShowNotDispatched}
            className="data-[state=checked]:bg-[#1d4ed8]"
          />
          <Label
            htmlFor="dispatch-filter"
            className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
          >
            Yet to Dispatch
          </Label>
          {showNotDispatched && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-amber-200 text-amber-700 bg-amber-50"
            >
              {vehicles.filter((v) => !v.dispatched).length} pending
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          Showing {filteredVehicles.length} of {vehicles.length}
        </span>
      </div>
    </div>
  );
}
export default TripFiltersBar;
