import { Search, Filter, CalendarDays, X } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function ShipmentFiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  onClearDates,
  podFilter,
  onPodFilterChange,
  statusCounts,
  totalShipments,
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[240px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by Shipment ID, Driver, Vehicle..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 bg-white border-border"
        />
      </div>

      <Select value={statusFilter ?? "all"} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[170px] h-9 bg-white border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <SelectValue placeholder="All Statuses" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses ({statusCounts.all})</SelectItem>
          <SelectItem value="Pending">Pending ({statusCounts.Pending || 0})</SelectItem>
          <SelectItem value="In Transit">In Transit ({statusCounts["In Transit"] || 0})</SelectItem>
          <SelectItem value="Delivered">Delivered ({statusCounts.Delivered || 0})</SelectItem>
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

      <Select value={podFilter ?? "all"} onValueChange={onPodFilterChange}>
        <SelectTrigger className="w-[150px] h-9 bg-white border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <SelectValue placeholder="All POD" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All POD</SelectItem>
          <SelectItem value="Not Generated">Not Generated</SelectItem>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="Partial">Partial</SelectItem>
          <SelectItem value="Signed">Signed</SelectItem>
        </SelectContent>
      </Select>

      <div className="ml-auto text-xs text-muted-foreground">
        Showing {statusCounts.filtered || 0} of {totalShipments} shipments
      </div>
    </div>
  );
}

export default ShipmentFiltersBar;