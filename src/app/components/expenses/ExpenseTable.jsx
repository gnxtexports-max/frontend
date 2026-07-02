import { useState } from "react";
import { format } from "date-fns";
import {
  Wallet,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Receipt,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { HIGH_EXPENSE_THRESHOLD, ITEMS_PER_PAGE } from "./data/expensesData";
import { useAuth } from "../../context/AuthContext";

function SortableHead({ label, field, current, dir, onSort, className = "" }) {
  const isActive = current === field;
  return (
    <TableHead className={`text-xs text-muted-foreground ${className}`}>
      <button
        onClick={() => onSort(field)}
        className={`flex items-center gap-1 hover:text-foreground transition-colors ${className.includes("text-right") ? "ml-auto" : ""
          } ${isActive ? "text-foreground" : ""}`}
      >
        {label}
      </button>
    </TableHead>
  );
}

function ExpenseTypeBadge({ type }) {
  const styles = {
    Fuel: "bg-orange-50 text-orange-700 border-orange-200",
    Toll: "bg-violet-50 text-violet-700 border-violet-200",
    Maintenance: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Loading/Unloading": "bg-blue-50 text-blue-700 border-blue-200",
    "Driver Allowance": "bg-amber-50 text-amber-700 border-amber-200",
    Miscellaneous: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${styles[type] || styles.Miscellaneous}`}>
      {type}
    </Badge>
  );
}

export function ExpenseTable({
  paginated,
  filtered,
  currentPage,
  setCurrentPage,
  totalPages,
  sortField,
  sortDir,
  toggleSort,
  onViewExpense,
  onAddExpenseForTrip,
  onEditExpense,
  onDeleteExpense,
  selectMode,
  selectedTripIds,
  onSelectTrip,
  onToggleSelectAll,
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "Super Admin";
  const [expandedTrips, setExpandedTrips] = useState({});

  const toggleTrip = (tripId) => {
    setExpandedTrips((prev) => ({
      ...prev,
      [tripId]: !prev[tripId],
    }));
  };

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f8f9fb] hover:bg-[#f8f9fb] border-b border-border">
              {selectMode && (
                <TableHead className="w-[50px] text-center p-3">
                  <input
                    type="checkbox"
                    checked={
                      paginated.length > 0 &&
                      paginated.every((t) => selectedTripIds.has(t.tripId))
                    }
                    onChange={(e) => onToggleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                </TableHead>
              )}
              <TableHead className="w-[50px]"></TableHead>
              <SortableHead
                label="Trip / Shipment ID"
                field="tripId"
                current={sortField}
                dir={sortDir}
                onSort={toggleSort}
              />
              <SortableHead
                label="Driver Name"
                field="driverName"
                current={sortField}
                dir={sortDir}
                onSort={toggleSort}
              />
              <SortableHead
                label="Vehicle ID"
                field="vehicleId"
                current={sortField}
                dir={sortDir}
                onSort={toggleSort}
              />
              <SortableHead
                label="Total kg per shipment"
                field="totalWeightKg"
                current={sortField}
                dir={sortDir}
                onSort={toggleSort}
                className="text-right"
              />
              <SortableHead
                label="Expense Entries Count"
                field="breakdown"
                current={sortField}
                dir={sortDir}
                onSort={toggleSort}
              />
              <SortableHead
                label="Total Trip Expense"
                field="amount"
                current={sortField}
                dir={sortDir}
                onSort={toggleSort}
                className="text-right"
              />
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={selectMode ? 9 : 8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Wallet className="w-8 h-8 opacity-30" />
                    <p className="text-sm font-medium">No trip expenses recorded</p>
                    <p className="text-xs">Create an expense record to begin tracking costs.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((tripGroup, idx) => {
                const isExpanded = !!expandedTrips[tripGroup.tripId];
                const breakdownCount = tripGroup.breakdown?.length || 0;

                return (
                  <>
                    {/* Parent Group Row */}
                    <TableRow
                      key={tripGroup.tripId}
                      className={`transition-colors hover:bg-slate-50/50 cursor-pointer ${isExpanded ? "bg-[#f8faff] border-b-0" : idx % 2 === 1 ? "bg-[#fbfbfc]" : ""
                        }`}
                      onClick={() => toggleTrip(tripGroup.tripId)}
                    >
                      {selectMode && (
                        <TableCell className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedTripIds.has(tripGroup.tripId)}
                            onChange={() => onSelectTrip(tripGroup.tripId)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </TableCell>
                      )}
                      <TableCell className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 p-0 hover:bg-slate-200/50 rounded-md"
                          onClick={() => toggleTrip(tripGroup.tripId)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4 text-slate-500" />
                          )}
                        </Button>
                      </TableCell>

                      <TableCell className="text-sm font-semibold text-foreground p-3">
                        <span className="bg-[#f0f4ff] text-[#1d4ed8] px-2 py-0.5 rounded text-xs tracking-tight font-semibold">
                          {tripGroup.tripId || "Manual Entry"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-foreground p-3 font-medium">
                        {tripGroup.driverName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground p-3">
                        {tripGroup.vehicleId}
                      </TableCell>
                      <TableCell className="text-sm text-right font-medium p-3 tabular-nums text-[#334155]">
                        {tripGroup.totalWeightKg ? `${tripGroup.totalWeightKg.toLocaleString()} kg` : "0 kg"}
                      </TableCell>
                      <TableCell className="p-3">
                        <Badge variant="secondary" className="bg-[#eef2f6] text-[#334155] border-0 text-xs font-semibold px-2 py-0.5">
                          {breakdownCount} entries
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-right tabular-nums font-bold p-3">
                        <span
                          className={
                            tripGroup.amount >= HIGH_EXPENSE_THRESHOLD
                              ? "text-red-600 font-extrabold"
                              : "text-[#0f172a]"
                          }
                        >
                          ₹{tripGroup.amount.toLocaleString("en-IN")}
                        </span>
                      </TableCell>
                      <TableCell className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] text-[#1d4ed8] hover:text-[#1e40af] hover:bg-[#f0f4ff] gap-1 px-2"
                          onClick={() => onAddExpenseForTrip(tripGroup.tripId)}
                        >
                          <Plus className="w-3 h-3" /> Add
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expandable Breakdown Child Row */}
                    {isExpanded && (
                      <TableRow className="bg-[#f8faff] hover:bg-[#f8faff]">
                        <TableCell colSpan={selectMode ? 9 : 8} className="p-4 pt-1 pb-4">
                          <div className="border border-[#1d4ed8]/10 rounded-xl bg-white shadow-sm overflow-hidden ml-11 mr-4">
                            <Table className="min-w-full">
                              <TableHeader className="bg-slate-50/80">
                                <TableRow className="border-b border-slate-100 hover:bg-slate-50/80">
                                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2 px-3">
                                    Date
                                  </TableHead>
                                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2 px-3">
                                    Expense Type(s)
                                  </TableHead>
                                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2 px-3">
                                    Description / Notes
                                  </TableHead>
                                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2 px-3 text-right">
                                    Amount
                                  </TableHead>
                                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2 px-3 text-right w-[110px]">
                                    Actions
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {tripGroup.breakdown.map((item) => (
                                  <TableRow
                                    key={item._id}
                                    onDoubleClick={() => onViewExpense(item)}
                                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
                                  >
                                    <TableCell className="text-xs text-muted-foreground py-2 px-3">
                                      {item.date ? format(new Date(item.date), "dd MMM yyyy") : "N/A"}
                                    </TableCell>
                                    <TableCell className="py-2 px-3">
                                      <div className="flex flex-wrap gap-1">
                                        {item.items?.map((expItem, expIdx) => (
                                          <div key={expIdx} className="flex items-center gap-1.5">
                                            <ExpenseTypeBadge type={expItem.expenseType} />
                                            {expItem.liters && (
                                              <span className="text-[10px] text-muted-foreground">
                                                ({expItem.liters} L)
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate py-2 px-3">
                                      {item.notes || "---"}
                                    </TableCell>
                                    <TableCell className="text-xs text-right font-semibold text-slate-900 py-2 px-3 tabular-nums">
                                      ₹{item.amount.toLocaleString("en-IN")}
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-end gap-1.5">
                                        {item.receiptUrl && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-7 h-7 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                            onClick={() => window.open(item.receiptUrl, "_blank")}
                                            title="View Receipt"
                                          >
                                            <Receipt className="w-3.5 h-3.5" />
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="w-7 h-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                          onClick={() => onEditExpense(item)}
                                          title="Edit Entry"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        {isAdmin && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-7 h-7 text-red-600 hover:text-red-800 hover:bg-red-50"
                                            onClick={() => {
                                              if (window.confirm("Are you sure you want to delete this expense entry?")) {
                                                onDeleteExpense(item._id);
                                              }
                                            }}
                                            title="Delete Entry"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-slate-50/50">
        <p className="text-xs text-muted-foreground">
          Showing{" "}
          {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
          –{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} Trips
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 bg-white"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="icon"
              className={`w-8 h-8 text-xs bg-white ${page === currentPage ? "bg-[#1d4ed8] hover:bg-[#1e40af] text-white" : ""
                }`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 bg-white"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
export default ExpenseTable;
