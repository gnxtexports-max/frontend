import { useState, useMemo, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "../ui/sheet";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import {
  Calendar,
  User,
  Car,
  Download,
  X,
  Search,
  CheckSquare,
  Square,
  Trash2,
  Eye,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { useAuth } from "../../context/AuthContext";
import { getPODConfig } from "./utils/shipmentStyles";
import { useStickyScrollbar } from "../../hooks/useStickyScrollbar";

export function HistoryShipmentSheet({ open, onOpenChange, historyShipments = [], setSelectedShipment, setViewSheetOpen, onDeleted }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "Super Admin";

  // Filter state
  const [dealerSearch, setDealerSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // Server-side pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiShipments, setApiShipments] = useState([]);

  const getRobustApiUrl = () => {
    let raw = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";
    raw = raw.replace(/\/$/, "");
    if (!raw.endsWith("/api")) {
      raw += "/api";
    }
    return raw;
  };
  const API_BASE_URL = getRobustApiUrl();

  // Reset page on filter/limit change
  useEffect(() => {
    setPage(1);
  }, [dealerSearch, vehicleSearch, fromDate, toDate, limit]);

  // Dedicated server-side fetching for history records
  const fetchHistory = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("status", "Closed,Cancelled,Delivered");
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      const searchParts = [dealerSearch.trim(), vehicleSearch.trim()].filter(Boolean);
      if (searchParts.length > 0) {
        params.append("search", searchParts.join(" "));
      }

      const res = await fetch(`${API_BASE_URL}/shipments?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch history");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setApiShipments(json.data);
        if (json.pagination) {
          setTotal(json.pagination.total ?? json.data.length);
          setTotalPages(json.pagination.totalPages ?? 1);
        } else {
          setTotal(json.data.length);
          setTotalPages(1);
        }
      }
    } catch (err) {
      console.error("Fetch history error:", err);
      // Fallback to local prop array if API request fails
      setApiShipments(historyShipments);
      setTotal(historyShipments.length);
      setTotalPages(Math.ceil(historyShipments.length / limit) || 1);
    } finally {
      setLoading(false);
    }
  }, [open, page, limit, fromDate, toDate, dealerSearch, vehicleSearch, API_BASE_URL, historyShipments]);

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open, page, limit, fromDate, toDate, dealerSearch, vehicleSearch, fetchHistory]);

  const displayShipments = useMemo(() => {
    if (apiShipments.length > 0) return apiShipments;

    // Local fallback filtering when offline or API returns empty fallback
    return historyShipments.filter((s) => {
      const dest = s.destinations?.[0] || {};

      const matchesDealer =
        !dealerSearch ||
        (dest.customerName && dest.customerName.toLowerCase().includes(dealerSearch.toLowerCase()));

      const matchesVehicle =
        !vehicleSearch ||
        (s.vehicleNumber && s.vehicleNumber.toLowerCase().includes(vehicleSearch.toLowerCase()));

      let matchesDate = true;
      const targetDate = s.deliveryDate ? new Date(s.deliveryDate) : s.createdAt ? new Date(s.createdAt) : null;
      if (targetDate) {
        if (fromDate) {
          const f = new Date(fromDate);
          f.setHours(0, 0, 0, 0);
          if (targetDate < f) matchesDate = false;
        }
        if (toDate) {
          const t = new Date(toDate);
          t.setHours(23, 59, 59, 999);
          if (targetDate > t) matchesDate = false;
        }
      }

      return matchesDealer && matchesVehicle && matchesDate;
    });
  }, [apiShipments, historyShipments, dealerSearch, vehicleSearch, fromDate, toDate]);

  const {
    tableContainerRef,
    scrollbarRef,
    sentinelRef,
    scrollWidth,
    showStickyScrollbar,
    positionStyle,
    handleTableScroll,
    handleScrollbarScroll,
  } = useStickyScrollbar([displayShipments, open]);

  // Handle selection logic
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleToggleSelectAll = () => {
    const allFilteredIds = displayShipments.map((s) => s._id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const isAllSelected = displayShipments.length > 0 && displayShipments.every((s) => selectedIds.includes(s._id));

  const handleExport = async () => {
    if (!selectedIds.length) {
      alert("Please select at least one shipment from the list to export.");
      return;
    }

    try {
      const idsParam = selectedIds.join(",");
      const res = await fetch(`${API_BASE_URL}/shipments/export?ids=${idsParam}`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Export failed");
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `GNXT_Shipments_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("Export ZIP error:", err);
      alert("Export failed: " + err.message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-5xl overflow-y-auto flex flex-col h-full bg-white p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5 shrink-0 bg-white -mx-6 -mt-6 px-6 pt-6 shadow-sm">
          <div>
            <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
              Delivered Shipments History
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground mt-1">
              Search, filter, navigate, select, and export completed distributions to Excel.
            </SheetDescription>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && isAdmin && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                  className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-semibold h-9 px-3 gap-1.5 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} shipments from history?`)) {
                      for (const id of selectedIds) {
                        try {
                          await fetch(`${API_BASE_URL}/shipments/${id}`, { method: "DELETE", credentials: "include" });
                        } catch (e) {
                          console.error("Failed to delete", id, e);
                        }
                      }
                      setSelectedIds([]);
                      fetchHistory();
                      if (onDeleted) onDeleted();
                    }
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 text-xs font-semibold h-9 px-3 gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete ({selectedIds.length})
                </Button>
              </>
            )}
            <Button
              onClick={handleExport}
              disabled={selectedIds.length === 0}
              className="gap-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white shadow-sm font-semibold text-xs cursor-pointer h-9 px-4 rounded-lg transition-all duration-150 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Export Selected ({selectedIds.length})
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm space-y-3 mb-5 shrink-0">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Search & Filters</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Dealer Wise */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by Dealer (Customer)..."
                value={dealerSearch}
                onChange={(e) => setDealerSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50/30 border-border"
              />
              {dealerSearch && (
                <button
                  onClick={() => setDealerSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Vehicle Wise */}
            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by Vehicle No..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50/30 border-border"
              />
              {vehicleSearch && (
                <button
                  onClick={() => setVehicleSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* From Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="From Date"
                className="pl-9 h-9 text-xs bg-slate-50/30 border-border"
              />
              {fromDate && (
                <button
                  onClick={() => setFromDate("")}
                  className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* To Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="To Date"
                className="pl-9 h-9 text-xs bg-slate-50/30 border-border"
              />
              {toDate && (
                <button
                  onClick={() => setToDate("")}
                  className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* History Table Container */}
        <div className="bg-white rounded-xl border border-border shadow-sm flex-1 overflow-hidden flex flex-col min-h-0 relative">
          <div
            ref={tableContainerRef}
            onScroll={handleTableScroll}
            className="flex-1 overflow-auto relative [&_[data-slot=table-container]]:overflow-x-visible"
          >
            <Table className="min-w-[1200px]">
              <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                <TableRow>
                  {/* Select Checkbox Column */}
                  <TableHead className="pl-4 w-[50px]">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-muted-foreground hover:text-[#1d4ed8] cursor-pointer"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#1d4ed8]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="w-[140px]">LR Number</TableHead>
                  <TableHead className="w-[110px]">Plant No</TableHead>
                  <TableHead className="w-[130px]">Shipment ID</TableHead>
                  <TableHead className="w-[180px]">Dealer & Location</TableHead>
                  <TableHead className="w-[150px]">Vehicle & Driver</TableHead>
                  <TableHead className="w-[110px]">Items / Wt</TableHead>
                  <TableHead className="w-[110px]">Delivery Date</TableHead>
                  <TableHead className="w-[110px]">POD Status</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                  <TableHead className="w-[80px] pr-4 text-right">View</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-48 text-center bg-slate-50/10">
                      <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin text-[#1d4ed8]" />
                        <p className="text-xs font-medium">Loading history shipments...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayShipments.map((s) => {
                    const dest = s.destinations?.[0] || {};
                    const isSelected = selectedIds.includes(s._id);
                    const plantNumbers = (dest.plantReferenceNumber || "")
                      .split(",")
                      .map((p) => p.trim())
                      .filter(Boolean);

                    const podConfig = getPODConfig(s);
                    return (
                      <TableRow
                        key={s._id}
                        className={`hover:bg-muted/10 transition-colors ${isSelected ? "bg-blue-50/20" : ""}`}
                      >
                        {/* Checkbox */}
                        <TableCell className="pl-4">
                          <button
                            onClick={() => handleToggleSelect(s._id)}
                            className="text-muted-foreground hover:text-[#1d4ed8] cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#1d4ed8]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </TableCell>

                        {/* LR Number */}
                        <TableCell className="font-semibold text-[#1d4ed8] text-xs">
                          {dest.lrNumber || "—"}
                        </TableCell>

                        {/* Plant Number */}
                        <TableCell className="text-xs">
                          {plantNumbers.length > 1 ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {plantNumbers[0]}
                              <span className="bg-slate-200 text-slate-800 text-[9px] px-1 rounded-full font-bold">
                                +{plantNumbers.length - 1}
                              </span>
                            </span>
                          ) : (
                            <span className="font-semibold text-slate-600">
                              {dest.plantReferenceNumber || "—"}
                            </span>
                          )}
                        </TableCell>

                        {/* Shipment ID */}
                        <TableCell className="font-semibold text-slate-700 text-xs">
                          {s.shipmentId || "—"}
                        </TableCell>

                        {/* Dealer & Location */}
                        <TableCell>
                          <div className="max-w-[160px] truncate">
                            <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                              {dest.customerName || "—"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                              {dest.deliveryLocation || "—"}
                            </p>
                          </div>
                        </TableCell>

                        {/* Vehicle & Driver */}
                        <TableCell>
                          <div className="max-w-[130px] truncate">
                            <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                              {s.vehicleNumber || "—"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                              {s.driverName || "—"}
                            </p>
                          </div>
                        </TableCell>

                        {/* Items & Weight */}
                        <TableCell className="text-xs text-slate-700">
                          <p className="font-semibold">{s.totalQuantity || 0} items</p>
                          <p className="text-[10px] text-slate-400">{s.totalWeightKg || 0} kg</p>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-[11px] text-slate-500 font-medium">
                          {s.deliveryDate
                            ? new Date(s.deliveryDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : s.createdAt
                            ? new Date(s.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </TableCell>

                        {/* POD Status */}
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border ${podConfig.className}`}
                          >
                            {podConfig.icon && <FileCheck className="w-3 h-3" />}
                            {podConfig.label}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              s.status === "Delivered" || s.status === "Closed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                                : "bg-red-50 text-red-700 border-red-200 text-[10px]"
                            }
                          >
                            {s.status === "Closed" ? "Delivered" : s.status}
                          </Badge>
                        </TableCell>

                        {/* View Action Column */}
                        <TableCell className="pr-4 text-right">
                          <button
                            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500 hover:text-foreground inline-flex cursor-pointer"
                            onClick={() => {
                              setSelectedShipment(s);
                              setViewSheetOpen(true);
                              onOpenChange(false);
                            }}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}

                {!loading && displayShipments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="h-48 text-center text-muted-foreground bg-slate-50/10">
                      <div className="flex flex-col items-center justify-center gap-2 py-8">
                        <Search className="w-8 h-8 text-slate-300" />
                        <p className="text-sm font-semibold">No delivered shipments match your filters</p>
                        <p className="text-xs text-slate-400">
                          Try adjusting your dealer name, vehicle, or date parameters above.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div ref={sentinelRef} className="h-px w-full" />
          </div>

          {showStickyScrollbar && (
            <div
              ref={scrollbarRef}
              onScroll={handleScrollbarScroll}
              className="fixed bottom-0 bg-white/95 border-t border-border z-50 overflow-x-auto overflow-y-hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)] transition-opacity duration-200"
              style={{
                left: positionStyle.left,
                width: positionStyle.width,
                height: "16px",
              }}
            >
              <div style={{ width: scrollWidth, height: "1px" }} />
            </div>
          )}

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-border rounded-b-xl shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Showing</span>
              <span className="font-semibold text-slate-800">
                {total === 0 ? 0 : (page - 1) * limit + 1}
              </span>
              <span>to</span>
              <span className="font-semibold text-slate-800">{Math.min(page * limit, total)}</span>
              <span>of</span>
              <span className="font-semibold text-slate-800">{total}</span>
              <span>records</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="h-8 text-xs bg-white border border-border rounded px-2 py-0.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(1)}
                  disabled={page <= 1 || loading}
                  className="h-8 w-8 text-slate-600"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="h-8 w-8 text-slate-600"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-semibold px-2 text-slate-700">
                  Page {page} of {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="h-8 w-8 text-slate-600"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages || loading}
                  className="h-8 w-8 text-slate-600"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default HistoryShipmentSheet;
