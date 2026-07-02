import { Search, Filter } from "lucide-react";
import { Input, } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function VehicleFiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  availFilter,
  onAvailFilterChange,
  onClearFilters,
  hasActiveFilters,
}) {
  return (
    <div className="px-6 pb-4 shrink-0">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by vehicle no, model, driver..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-white text-sm"
          />
        </div>


          <Select value={statusFilter || "all"} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[160px] h-9 bg-white text-sm">
            <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>

          <SelectContent >
            <SelectItem value="all" >All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="In Transit">In Transit</SelectItem>
            <SelectItem value="Idle">Idle</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>

      <Select value={availFilter || "all"} onValueChange={onAvailFilterChange}>
          <SelectTrigger className="w-[180px] h-9 bg-white text-sm">
            <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Availability</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="On Trip">On Trip</SelectItem>
            <SelectItem value="Scheduled">Scheduled</SelectItem>
            <SelectItem value="Unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            onClick={onClearFilters}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
