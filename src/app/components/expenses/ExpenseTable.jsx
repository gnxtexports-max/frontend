import { useState, useRef } from "react";
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
  Plus,
  GripHorizontal,
  Maximize2,
  Minimize2,
  Truck,
  Wrench,
  Briefcase,
  Layers,
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
import { HIGH_EXPENSE_THRESHOLD, ITEMS_PER_PAGE } from "./data/expensesData";
import { useAuth } from "../../context/AuthContext";

function SortableHead({ label, field, current, dir, onSort, className = "" }) {
  const isActive = current === field;
  return (
    <TableHead className={`text-xs text-muted-foreground ${className}`}>
      <button
        onClick={() => onSort(field)}
        className={`flex items-center gap-1 hover:text-foreground transition-colors ${
          className.includes("text-right") ? "ml-auto" : ""
        } ${isActive ? "text-foreground" : ""}`}
      >
        {label}
      </button>
    </TableHead>
  );
}

function ExpenseTypeBadge({ type }) {
  const styles = {
    // Dispatch Types
    Fuel: "bg-orange-50 text-orange-700 border-orange-200",
    Toll: "bg-violet-50 text-violet-700 border-violet-200",
    Driver: "bg-amber-50 text-amber-700 border-amber-200",
    "Market Vehicle": "bg-emerald-50 text-emerald-700 border-emerald-200",
    Overtime: "bg-blue-50 text-blue-700 border-blue-200",
    "MVD Penalty": "bg-red-50 text-red-700 border-red-200",
    // Maintenance Types
    Insurance: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Pollution: "bg-teal-50 text-teal-700 border-teal-200",
    Fitness: "bg-cyan-50 text-cyan-700 border-cyan-200",
    Tax: "bg-rose-50 text-rose-700 border-rose-200",
    "Tyre Purchase": "bg-purple-50 text-purple-700 border-purple-200",
    Repair: "bg-pink-50 text-pink-700 border-pink-200",
    // Misc Types
    "Office Expense": "bg-amber-50 text-amber-700 border-amber-200",
    "Tea & Snacks": "bg-amber-50 text-amber-700 border-amber-200",
    Stationery: "bg-amber-50 text-amber-700 border-amber-200",
    Printing: "bg-amber-50 text-amber-700 border-amber-200",
    Rent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Electricity: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Internet: "bg-cyan-50 text-cyan-700 border-cyan-200",
    Courier: "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Staff Welfare": "bg-rose-50 text-rose-700 border-rose-200",
    // Fallbacks
    Maintenance: "bg-purple-50 text-purple-700 border-purple-200",
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
  filtered = [],
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
  activeCategory = "all",
  onCategoryChange,
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "Super Admin";
  const [expandedTrips, setExpandedTrips] = useState({});

  // Full view & drag resize state
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(440);
  const [tableContentHeight, setTableContentHeight] = useState(() => {
    try {
      const saved = localStorage.getItem("expenses_table_content_height");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 200 && parsed <= 1200) return parsed;
      }
    } catch (_) {}
    return 440;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Drag resize handlers
  const handlePointerDown = (e) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = tableContentHeight;
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const delta = e.clientY - dragStartY.current;
    const maxHeight = typeof window !== "undefined" ? Math.floor(window.innerHeight * 0.78) : 800;
    const minHeight = 200;
    const newHeight = Math.min(Math.max(dragStartHeight.current - delta, minHeight), maxHeight);
    setTableContentHeight(newHeight);
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      setIsDragging(false);
      try {
        localStorage.setItem("expenses_table_content_height", String(tableContentHeight));
      } catch (_) {}
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };

  const toggleTrip = (tripId) => {
    setExpandedTrips((prev) => ({
      ...prev,
      [tripId]: !prev[tripId],
    }));
  };

  // Helper to open receipt through authenticated endpoint
  const handleOpenReceipt = (receiptUrl, expenseId) => {
    if (!receiptUrl && !expenseId) return;
    const base = (import.meta.env?.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
    let targetUrl = "";
    if (receiptUrl && receiptUrl.startsWith("data:")) {
      const w = window.open();
      if (w) {
        w.document.write(`<img src="${receiptUrl}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
        w.document.title = "Receipt Preview";
      }
      return;
    } else if (expenseId) {
      targetUrl = `${base}/api/expenses/${expenseId}/receipt`;
    } else if (receiptUrl && !receiptUrl.includes("cloudflarestorage.com")) {
      targetUrl = receiptUrl.startsWith("http") ? receiptUrl : `${base}${receiptUrl.startsWith("/") ? "" : "/"}${receiptUrl}`;
    }
    if (targetUrl) window.open(targetUrl, "_blank");
  };

  return (
    <div
      className={`bg-white rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col transition-all ${
        isFullScreen
          ? "fixed inset-4 z-50 shadow-2xl ring-1 ring-slate-900/15"
          : "relative"
      } ${isDragging ? "select-none shadow-md ring-1 ring-blue-400" : ""}`}
    >
      {/* ── TOP DRAG RESIZE HANDLE BAR ───────────────────── */}
      {!isFullScreen && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={() => setTableContentHeight(440)}
          title="Drag UP to increase table height, drag DOWN to decrease (Double-click to reset)"
          style={{ touchAction: "none" }}
          className={`h-3.5 w-full border-b border-slate-200/80 bg-slate-50 hover:bg-blue-50/90 active:bg-blue-100 cursor-ns-resize flex items-center justify-center transition-colors select-none group shrink-0 ${
            isDragging ? "bg-blue-100 ring-1 ring-blue-300" : ""
          }`}
        >
          <div className="w-14 h-1 rounded-full bg-slate-300 group-hover:bg-blue-500 group-active:bg-blue-600 transition-colors" />
        </div>
      )}

      {/* ── CONTROL & CATEGORY TAB BAR HEADER ───────────── */}
      <div className="px-5 py-3 border-b border-border bg-[#fafbfc] flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-lg border border-slate-200/70">
          <button
            onClick={() => {
              if (onCategoryChange) onCategoryChange("all");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeCategory === "all"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            All Expenses
          </button>
          <button
            onClick={() => {
              if (onCategoryChange) onCategoryChange("dispatch");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeCategory === "dispatch"
                ? "bg-white text-[#1d4ed8] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-[#1d4ed8]" />
            Dispatch
          </button>
          <button
            onClick={() => {
              if (onCategoryChange) onCategoryChange("maintenance");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeCategory === "maintenance"
                ? "bg-white text-purple-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-purple-600" />
            Maintenance
          </button>
          <button
            onClick={() => {
              if (onCategoryChange) onCategoryChange("miscellaneous");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeCategory === "miscellaneous"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
            Misc
          </button>
        </div>

        {/* Action Controls & Full View Toggle */}
        <div className="flex items-center gap-3">
          {!isFullScreen && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 select-none">
              <GripHorizontal className="w-3 h-3 text-slate-400" />
              Drag to resize
            </span>
          )}

          <Button
            variant={isFullScreen ? "default" : "outline"}
            size="sm"
            onClick={toggleFullScreen}
            className={`h-7 px-2.5 text-xs gap-1.5 font-medium ${
              isFullScreen
                ? "bg-[#1d4ed8] hover:bg-blue-700 text-white shadow-xs"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            title={isFullScreen ? "Exit Full View" : "View Full Table"}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Full View</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full View</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── TABLE VIEWPORT CONTAINER (DYNAMIC RESIZE / FULL SCREEN SCROLL) ── */}
      <div
        style={
          isFullScreen
            ? { flex: 1, overflowY: "auto" }
            : { height: `${tableContentHeight}px`, overflowY: "auto" }
        }
        className="relative overflow-x-auto"
      >
        <Table className="min-w-full">
          <TableHeader className="sticky top-0 z-20 bg-[#f8f9fb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <TableRow className="border-b border-border bg-[#f8f9fb] hover:bg-[#f8f9fb]">
              {selectMode && (
                <TableHead className="w-[45px] text-center p-3">
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
              <TableHead className="w-[45px] p-3 text-center"></TableHead>

              {/* DYNAMIC TABLE HEADERS BASED ON CATEGORY */}
              {activeCategory === "dispatch" ? (
                <>
                  <SortableHead label="Shipment / Trip ID" field="tripId" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Driver Name" field="driverName" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Vehicle No" field="vehicleId" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Weight (KG)" field="totalWeightKg" current={sortField} dir={sortDir} onSort={toggleSort} className="text-right" />
                  <TableHead className="text-xs text-muted-foreground text-right">KM</TableHead>
                  <SortableHead label="Entries" field="breakdown" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Total Expense" field="amount" current={sortField} dir={sortDir} onSort={toggleSort} className="text-right" />
                </>
              ) : activeCategory === "maintenance" ? (
                <>
                  <SortableHead label="Vehicle ID / Number" field="tripId" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Driver" field="driverName" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <TableHead className="text-xs text-muted-foreground">Service Types</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Latest Date</TableHead>
                  <SortableHead label="Entries" field="breakdown" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Total Expense" field="amount" current={sortField} dir={sortDir} onSort={toggleSort} className="text-right" />
                </>
              ) : activeCategory === "miscellaneous" ? (
                <>
                  <TableHead className="text-xs text-muted-foreground">Description / Notes</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Expense Types</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Payment Mode</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Date</TableHead>
                  <SortableHead label="Entries" field="breakdown" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Total Amount" field="amount" current={sortField} dir={sortDir} onSort={toggleSort} className="text-right" />
                </>
              ) : (
                <>
                  <SortableHead label="Trip / Reference ID" field="tripId" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Driver" field="driverName" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Vehicle" field="vehicleId" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <TableHead className="text-xs text-muted-foreground">Details / Metrics</TableHead>
                  <SortableHead label="Entries" field="breakdown" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Total Expense" field="amount" current={sortField} dir={sortDir} onSort={toggleSort} className="text-right" />
                </>
              )}

              <TableHead className="w-[70px] pr-4 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Wallet className="w-8 h-8 opacity-30" />
                    <p className="text-sm font-medium">No expenses recorded</p>
                    <p className="text-xs">Create an expense record to begin tracking costs.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((tripGroup, idx) => {
                const isExpanded = !!expandedTrips[tripGroup.tripId];
                const breakdownCount = tripGroup.breakdown?.length || 0;
                const isMisc = tripGroup.category === "miscellaneous";
                const isMaint = tripGroup.category === "maintenance";

                // Unique types in breakdown
                const expenseTypesInGroup = [
                  ...new Set(
                    tripGroup.breakdown?.flatMap((e) =>
                      e.items && e.items.length > 0
                        ? e.items.map((i) => i.expenseType)
                        : [e.expenseType]
                    ).filter(Boolean)
                  ),
                ];

                return (
                  <>
                    {/* Parent Group Row */}
                    <TableRow
                      key={tripGroup.tripId || `trip-${idx}`}
                      className={`transition-colors hover:bg-slate-50/60 cursor-pointer ${
                        isExpanded
                          ? "bg-[#f8faff] border-b-0"
                          : idx % 2 === 1
                          ? "bg-[#fbfbfc]"
                          : "bg-white"
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

                      {/* Expand Chevron */}
                      <TableCell className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 p-0 hover:bg-slate-200/60 rounded-md"
                          onClick={() => toggleTrip(tripGroup.tripId)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                          )}
                        </Button>
                      </TableCell>

                      {/* DYNAMIC CELLS PER ACTIVE CATEGORY */}
                      {activeCategory === "dispatch" ? (
                        <>
                          <TableCell className="text-sm font-semibold text-foreground p-3">
                            <span className="bg-[#f0f4ff] text-[#1d4ed8] px-2 py-0.5 rounded text-xs font-semibold">
                              {tripGroup.tripId}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-foreground p-3 font-medium">
                            {tripGroup.driverName || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground p-3 font-medium">
                            {tripGroup.vehicleId || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-right font-medium p-3 tabular-nums text-slate-700">
                            {tripGroup.totalWeightKg ? `${tripGroup.totalWeightKg.toLocaleString()} kg` : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-right font-medium p-3 tabular-nums text-slate-700">
                            {tripGroup.km ? `${tripGroup.km.toLocaleString()} km` : "—"}
                          </TableCell>
                          <TableCell className="p-3">
                            <Badge variant="secondary" className="bg-[#eef2f6] text-[#334155] border-0 text-xs font-semibold px-2 py-0.5">
                              {breakdownCount} entries
                            </Badge>
                          </TableCell>
                        </>
                      ) : activeCategory === "maintenance" ? (
                        <>
                          <TableCell className="text-sm font-semibold text-foreground p-3">
                            <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-xs font-semibold">
                              {tripGroup.tripId}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-foreground p-3 font-medium">
                            {tripGroup.driverName !== "—" ? tripGroup.driverName : "Unassigned"}
                          </TableCell>
                          <TableCell className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {expenseTypesInGroup.map((t) => (
                                <ExpenseTypeBadge key={t} type={t} />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground p-3">
                            {tripGroup.date ? format(new Date(tripGroup.date), "dd MMM yyyy") : "—"}
                          </TableCell>
                          <TableCell className="p-3">
                            <Badge variant="secondary" className="bg-[#eef2f6] text-[#334155] border-0 text-xs font-semibold px-2 py-0.5">
                              {breakdownCount} entries
                            </Badge>
                          </TableCell>
                        </>
                      ) : activeCategory === "miscellaneous" ? (
                        <>
                          <TableCell className="text-sm text-foreground p-3 font-medium max-w-[240px] truncate">
                            {tripGroup.tripId !== "Miscellaneous Expense" ? tripGroup.tripId : "Office & General"}
                          </TableCell>
                          <TableCell className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {expenseTypesInGroup.map((t) => (
                                <ExpenseTypeBadge key={t} type={t} />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground p-3">
                            {tripGroup.paymentMode || "Cash"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground p-3">
                            {tripGroup.date ? format(new Date(tripGroup.date), "dd MMM yyyy") : "—"}
                          </TableCell>
                          <TableCell className="p-3">
                            <Badge variant="secondary" className="bg-[#eef2f6] text-[#334155] border-0 text-xs font-semibold px-2 py-0.5">
                              {breakdownCount} entries
                            </Badge>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          {/* "All" Overview Row */}
                          <TableCell className="text-sm font-semibold text-foreground p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded text-xs tracking-tight font-semibold ${
                                  isMaint
                                    ? "bg-purple-50 text-purple-700"
                                    : isMisc
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-[#f0f4ff] text-[#1d4ed8]"
                                }`}
                              >
                                {tripGroup.tripId}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[9px] px-1.5 py-0 uppercase ${
                                  isMaint
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : isMisc
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                              >
                                {isMaint ? "Maintenance" : isMisc ? "Misc" : "Dispatch"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-foreground p-3 font-medium">
                            {tripGroup.driverName || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground p-3">
                            {tripGroup.vehicleId || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 p-3">
                            {isMaint ? (
                              <span className="text-purple-700 font-medium">
                                {expenseTypesInGroup.join(", ") || "Vehicle Service"}
                              </span>
                            ) : isMisc ? (
                              <span className="text-amber-700 font-medium">General / Admin</span>
                            ) : (
                              <span>
                                {tripGroup.totalWeightKg ? `${tripGroup.totalWeightKg} kg` : "—"}{" "}
                                {tripGroup.km ? `• ${tripGroup.km} km` : ""}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="p-3">
                            <Badge variant="secondary" className="bg-[#eef2f6] text-[#334155] border-0 text-xs font-semibold px-2 py-0.5">
                              {breakdownCount} entries
                            </Badge>
                          </TableCell>
                        </>
                      )}

                      {/* Amount */}
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

                      {/* Action Button */}
                      <TableCell className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] text-[#1d4ed8] hover:text-[#1e40af] hover:bg-[#f0f4ff] gap-1 px-2 font-semibold"
                          onClick={() => onAddExpenseForTrip(tripGroup.tripId)}
                        >
                          <Plus className="w-3 h-3" /> Add
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expandable Breakdown Child Sub-Table */}
                    {isExpanded && (
                      <TableRow className="bg-[#f8faff] hover:bg-[#f8faff]">
                        <TableCell colSpan={9} className="p-4 pt-1 pb-4">
                          <div className="border border-[#1d4ed8]/15 rounded-xl bg-white shadow-xs overflow-hidden ml-8 mr-2">
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
                              <TableBody className="divide-y divide-slate-100">
                                {tripGroup.breakdown?.map((item, bIdx) => (
                                  <TableRow
                                    key={item._id || `breakdown-${bIdx}`}
                                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                                    onClick={() => onViewExpense(item)}
                                  >
                                    <TableCell className="text-xs text-slate-700 py-2 px-3 font-medium">
                                      {item.date ? format(new Date(item.date), "dd MMM yyyy") : "---"}
                                    </TableCell>
                                    <TableCell className="py-2 px-3">
                                      <div className="flex flex-wrap gap-1">
                                        {item.items && item.items.length > 0 ? (
                                          item.items.map((it, i) => (
                                            <ExpenseTypeBadge key={i} type={it.expenseType} />
                                          ))
                                        ) : (
                                          <ExpenseTypeBadge type={item.expenseType} />
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate py-2 px-3">
                                      {item.notes || item.description || "---"}
                                    </TableCell>
                                    <TableCell className="text-xs text-right font-bold text-slate-900 py-2 px-3 tabular-nums">
                                      ₹{(item.totalAmount !== undefined ? item.totalAmount : item.amount || 0).toLocaleString("en-IN")}
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-end gap-1.5">
                                        {item.receiptUrl && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-7 h-7 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                            onClick={() => handleOpenReceipt(item.receiptUrl, item._id)}
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

      {/* ── FOOTER PAGINATION BAR ────────────────────────── */}
      <div className="px-5 py-3 border-t border-border bg-[#fafbfc] flex items-center justify-between shrink-0">
        <p className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground">
            {filtered.length === 0
              ? "0"
              : `${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filtered.length
                )}`}
          </span>{" "}
          of <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          {activeCategory === "dispatch"
            ? "Trips"
            : activeCategory === "maintenance"
            ? "Vehicles"
            : activeCategory === "miscellaneous"
            ? "Entries"
            : "Records"}
        </p>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1 border-border"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </Button>

          <span className="text-xs text-muted-foreground px-2">
            Page <strong className="text-foreground">{currentPage}</strong> of{" "}
            <strong className="text-foreground">{totalPages || 1}</strong>
          </span>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1 border-border"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ExpenseTable;
