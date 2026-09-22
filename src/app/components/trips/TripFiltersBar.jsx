import { Search, Truck, Filter, CalendarDays, X } from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
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
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  onClearDates,
  showNotDispatched,
  setShowNotDispatched,
  filteredVehicles,
  statusCounts,
  vehicles = [],
}) {
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeFiltered = Array.isArray(filteredVehicles) ? filteredVehicles : [];
  const safeStatusCounts = statusCounts || {};

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[240px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by Vehicle, Driver, Shipment ID, Dealer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 bg-white border-border"
        />
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[240px] h-9 bg-white border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <SelectValue placeholder="Active Trips" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active Trips ({safeStatusCounts.all || 0})</SelectItem>
          <SelectItem value="all">All Statuses ({safeStatusCounts.all || 0})</SelectItem>
          <SelectItem value="In Transit">In Transit ({safeStatusCounts["In Transit"] || 0})</SelectItem>
          <SelectItem value="Waiting for Dispatch">Waiting for Dispatch ({safeStatusCounts["Waiting for Dispatch"] || 0})</SelectItem>
          <SelectItem value="Vehicle Arrival Pending">Vehicle Arrival Pending ({safeStatusCounts["Vehicle Arrival Pending"] || 0})</SelectItem>
        </SelectContent>
      </Select>

      <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
        <SelectTrigger className="w-[150px] h-9 bg-white border-border">
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

      <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-md border border-border h-9 text-xs">
        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-muted-foreground font-medium">From:</span>
        <input
          type="date"
          value={fromDate || ""}
          onChange={(e) => setFromDate && setFromDate(e.target.value)}
          className="bg-transparent outline-none cursor-pointer text-foreground"
        />
      </div>

      <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-md border border-border h-9 text-xs">
        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-muted-foreground font-medium">To:</span>
        <input
          type="date"
          value={toDate || ""}
          onChange={(e) => setToDate && setToDate(e.target.value)}
          className="bg-transparent outline-none cursor-pointer text-foreground"
        />
      </div>

      {(fromDate || toDate) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearDates}
          className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Clear
        </Button>
      )}

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
              {safeVehicles.filter((v) => !v.dispatched).length} pending
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          Showing {safeFiltered.length} of {safeVehicles.length}
        </span>
      </div>
    </div>
  );
}
export default TripFiltersBar;
