import { Search, Filter } from "lucide-react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { Button } from "../ui/button";

export function DriverFiltersBar({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
}) {
  return (
    <div className="px-6 pb-4 shrink-0">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-white text-sm"
          />
        </div>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-[150px] h-9 bg-white text-sm">
            <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Own">Own</SelectItem>
            <SelectItem value="Hired">Hired</SelectItem>
            <SelectItem value="Contract">Contract</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[150px] h-9 bg-white text-sm">
            <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Driving">Driving</SelectItem>
            <SelectItem value="Idle">Idle</SelectItem>
            <SelectItem value="Assigned">Assigned</SelectItem>
      
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {(typeFilter !== "all" || statusFilter !== "all" || searchQuery) && (
          <Button
            onClick={onClearFilters}
            // className="text-xs text-[#1d4ed8] hover:underline"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

export default DriverFiltersBar;