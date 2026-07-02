import { Search, CalendarDays, X, RotateCcw } from "lucide-react";

import { format } from "date-fns";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { expenseTypes } from "./data/expensesData";

export function ExpenseFiltersBar({
  searchQuery,
  setSearchQuery,
  setCurrentPage,
  filterDate,
  setFilterDate,
  dateOpen,
  setDateOpen,
  filterShipment,
  setFilterShipment,
  filterVehicle,
  setFilterVehicle,
  filterDriver,
  setFilterDriver,
  filterDealer,
  setFilterDealer,
  filterExpenseType,
  setFilterExpenseType,
  shipmentIds,
  vehicleIds,
  driverNames,
  dealerOptions = [],
  onClear,
  hasActiveFilters,
}) {

  return (
    <div className="bg-white border border-border rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search LR number, driver..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-9 bg-[#f5f6f8] border-transparent text-sm focus:border-border focus:bg-white"
          />
        </div>




        {/* LR Number */}
        <Select
          value={filterShipment}
          onValueChange={(v) => {
            setFilterShipment(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[150px] text-xs bg-white border-border">
            <SelectValue placeholder="All LR Numbers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All LR Numbers</SelectItem>
            {shipmentIds.filter(Boolean).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Vehicle */}
        <Select
          value={filterVehicle}
          onValueChange={(v) => {
            setFilterVehicle(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[140px] text-xs bg-white border-border">
            <SelectValue placeholder="All Vehicles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            {vehicleIds.filter(Boolean).map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Driver */}
        <Select
          value={filterDriver}
          onValueChange={(v) => {
            setFilterDriver(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[140px] text-xs bg-white border-border">
            <SelectValue placeholder="All Drivers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            {driverNames.filter(Boolean).map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Dealer / Customer */}
        <Select
          value={filterDealer}
          onValueChange={(v) => {
            setFilterDealer(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[150px] text-xs bg-white border-border">
            <SelectValue placeholder="All Dealers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dealers</SelectItem>
            {dealerOptions.filter(Boolean).map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>



        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={onClear}
            className="h-9 px-3 text-xs gap-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </Button>
        )}
      </div>

    </div>
  );
}
export default ExpenseFiltersBar;
