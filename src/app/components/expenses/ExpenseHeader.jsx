import { Plus, CalendarDays, CheckSquare, Square, FileArchive } from "lucide-react";
import { format } from "date-fns";
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

export function ExpenseHeader({ 
  onAddExpense, 
  onExport,
  onExportZip,
  filterDate,
  setFilterDate,
  dateOpen,
  setDateOpen,
  filterExpenseType,
  setFilterExpenseType,
  setCurrentPage,
  selectMode,
  onToggleSelectMode,
  selectedCount,
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-xl tracking-tight text-foreground">Expenses</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track and manage shipment-related costs
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Date Filter (Moved here for export filtering) */}
        <Popover open={dateOpen} onOpenChange={setDateOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`h-9 px-3 text-xs gap-1.5 border-border bg-white hover:bg-white ${
                !filterDate ? "text-muted-foreground" : "text-foreground"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {filterDate
                ? format(filterDate, "dd MMM yyyy")
                : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filterDate}
              onSelect={(d) => {
                setFilterDate(d ?? undefined);
                setDateOpen(false);
                setCurrentPage(1);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Expense Type Filter (Moved here for export filtering) */}
        <Select
          value={filterExpenseType}
          onValueChange={(v) => {
            setFilterExpenseType(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[140px] text-xs bg-white border-border">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {expenseTypes.filter(Boolean).map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={selectMode ? "default" : "outline"}
          onClick={onToggleSelectMode}
          className={`h-9 px-3 text-xs gap-1.5 border-border ${
            selectMode 
              ? "bg-[#1d4ed8] text-white hover:bg-[#1e40af]" 
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {selectMode ? (
            <CheckSquare className="w-3.5 h-3.5" />
          ) : (
            <Square className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          Select Mode
        </Button>

        <Button
          onClick={onExportZip}
          variant="outline"
          className="border-border gap-2 hover:bg-[#f8f9fb]"
        >
          <FileArchive className="w-4 h-4 text-muted-foreground" />
          Export with Receipts
        </Button>

        <Button
          onClick={onAddExpense}
          className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>
    </div>
  );
}
export default ExpenseHeader;
