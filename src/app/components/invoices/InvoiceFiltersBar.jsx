import { Search, Filter } from "lucide-react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function InvoiceFiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[280px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

        <Input
          placeholder="Search by Plant No, Customer, or Invoice #..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 bg-white border-border"
        />
      </div>

      <Select
        value={statusFilter}
        onValueChange={onStatusFilterChange}
      >
        <SelectTrigger className="w-[160px] h-9 bg-white">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue placeholder="All Status" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="All">All Status</SelectItem>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="Assigned">Assigned</SelectItem>
          <SelectItem value="In Transit">In Transit</SelectItem>
          <SelectItem value="Delivered">Delivered</SelectItem>
          <SelectItem value="Cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default InvoiceFiltersBar;