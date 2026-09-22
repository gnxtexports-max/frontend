import React, { useState, useEffect } from "react";
import { 
  Truck, 
  CalendarDays, 
  Filter, 
  RotateCcw, 
  Loader2, 
  CheckCircle2, 
  FileWarning, 
  IndianRupee, 
  Weight, 
  FileText 
} from "lucide-react";
import { Button } from "../ui/button";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

export function DespatchSummarySection({ 
  onCardClick, 
  initialFromDate = "2026-08-31", 
  initialToDate = "2026-09-09",
  draftFromDate: controlledDraftFrom,
  setDraftFromDate: setControlledDraftFrom,
  draftToDate: controlledDraftTo,
  setDraftToDate: setControlledDraftTo,
  appliedFromDate: controlledAppliedFrom,
  setAppliedFromDate: setControlledAppliedFrom,
  appliedToDate: controlledAppliedTo,
  setAppliedToDate: setControlledAppliedTo,
  onDataLoaded
}) {
  const defaultFrom = initialFromDate || "2026-08-31";
  const defaultTo = initialToDate || "2026-09-09";

  // Separate states: draft vs applied
  const [internalDraftFrom, setInternalDraftFrom] = useState(defaultFrom);
  const [internalDraftTo, setInternalDraftTo] = useState(defaultTo);
  const [internalAppliedFrom, setInternalAppliedFrom] = useState(defaultFrom);
  const [internalAppliedTo, setInternalAppliedTo] = useState(defaultTo);

  const draftFromDate = controlledDraftFrom !== undefined ? controlledDraftFrom : internalDraftFrom;
  const setDraftFromDate = setControlledDraftFrom || setInternalDraftFrom;

  const draftToDate = controlledDraftTo !== undefined ? controlledDraftTo : internalDraftTo;
  const setDraftToDate = setControlledDraftTo || setInternalDraftTo;

  const appliedFromDate = controlledAppliedFrom !== undefined ? controlledAppliedFrom : internalAppliedFrom;
  const setAppliedFromDate = setControlledAppliedFrom || setInternalAppliedFrom;

  const appliedToDate = controlledAppliedTo !== undefined ? controlledAppliedTo : internalAppliedTo;
  const setAppliedToDate = setControlledAppliedTo || setInternalAppliedTo;

  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    despatchedInvoices: { count: 0 },
    despatchedWeight: { weightFormatted: "0.00 kg" },
    deliveredWeight: { weightFormatted: "0.00 kg" },
    inTransitWeight: { weightFormatted: "0.00 kg" },
    podPending: { count: 0 },
    despatchCost: { amount: 0, amountFormatted: "₹ 0" },
    items: []
  });

  const fetchDispatchSummary = async (fDate = appliedFromDate, tDate = appliedToDate) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fDate) params.append("fromDate", fDate);
      if (tDate) params.append("toDate", tDate);

      const res = await fetch(`${API_BASE_URL}/dashboard/dispatch-summary?${params.toString()}`, {
        credentials: "include"
      });
      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
        if (onDataLoaded) {
          onDataLoaded(result.data);
        }
      }
    } catch (err) {
      console.error("Error fetching dispatch summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatchSummary(appliedFromDate, appliedToDate);
  }, []);

  const handleApply = () => {
    setAppliedFromDate(draftFromDate);
    setAppliedToDate(draftToDate);
    fetchDispatchSummary(draftFromDate, draftToDate);
  };

  const handleReset = () => {
    setDraftFromDate(defaultFrom);
    setDraftToDate(defaultTo);
    setAppliedFromDate(defaultFrom);
    setAppliedToDate(defaultTo);
    fetchDispatchSummary(defaultFrom, defaultTo);
  };

  const allItems = data.items || [];

  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4 transition-all">
      {/* Top Header Line: DESPATCH SUMMARY on left, Despatch Date badge on right */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground tracking-wider uppercase">
              Despatch Summary
            </h2>
            <p className="text-xs text-muted-foreground">
              Freight volumes, transit status, and associated trip expense costs by despatch date
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Despatch Date
          </span>
        </div>
      </div>

      {/* Date Filter Toolbar: From [date] To [date] [Apply] [Reset] */}
      <div className="flex flex-wrap items-center gap-2.5 bg-slate-50/90 p-2 rounded-lg border border-slate-200/80">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-md border border-slate-200 text-xs shadow-2xs">
          <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-medium">From:</span>
          <input
            type="date"
            value={draftFromDate || ""}
            onChange={(e) => setDraftFromDate(e.target.value)}
            className="bg-transparent outline-none cursor-pointer text-slate-800 text-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-md border border-slate-200 text-xs shadow-2xs">
          <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-medium">To:</span>
          <input
            type="date"
            value={draftToDate || ""}
            onChange={(e) => setDraftToDate(e.target.value)}
            className="bg-transparent outline-none cursor-pointer text-slate-800 text-xs font-medium"
          />
        </div>

        <Button
          size="sm"
          onClick={handleApply}
          disabled={loading}
          className="h-8 px-3.5 text-xs bg-[#1d4ed8] hover:bg-blue-800 text-white font-medium shadow-2xs cursor-pointer flex items-center gap-1"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Filter className="w-3.5 h-3.5" />
          )}
          <span>Apply</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="h-8 px-3 text-xs text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-100 shadow-2xs cursor-pointer flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </Button>
      </div>

      {/* Cards Layout matching client wireframe:
          Row 1: 3 cards (DESPATCHED INVOICES, DESPATCHED WEIGHT, DELIVERED WEIGHT)
          Row 2: 3 cards (IN TRANSIT WEIGHT, POD PENDING, DESPATCH COST)
      */}
      <div className="space-y-3.5 pt-1">
        {/* Row 1 (3 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Card 1: DESPATCHED INVOICES */}
          <div
            onClick={() => onCardClick && onCardClick("Despatched Shipments", "despatch", allItems)}
            className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/90 hover:border-blue-300 rounded-xl p-4 flex flex-col justify-between transition-all duration-150 cursor-pointer group shadow-2xs hover:shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider group-hover:text-blue-700 transition-colors">
                Despatched Invoices
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-1">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : data.despatchedInvoices?.count}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">Total invoices dispatched</p>
            </div>
          </div>

          {/* Card 2: DESPATCHED WEIGHT */}
          <div
            onClick={() => onCardClick && onCardClick("Despatched Shipments", "despatch", allItems)}
            className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/90 hover:border-purple-300 rounded-xl p-4 flex flex-col justify-between transition-all duration-150 cursor-pointer group shadow-2xs hover:shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider group-hover:text-purple-700 transition-colors">
                Despatched Weight
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center">
                <Weight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-1">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : data.despatchedWeight?.weightFormatted}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">Gross cargo dispatched</p>
            </div>
          </div>

          {/* Card 3: DELIVERED WEIGHT */}
          <div
            onClick={() => onCardClick && onCardClick("Delivered Consignments", "despatch", allItems.filter(s => s.status === "Delivered" || s.status === "Closed"))}
            className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/90 hover:border-emerald-300 rounded-xl p-4 flex flex-col justify-between transition-all duration-150 cursor-pointer group shadow-2xs hover:shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
                Delivered Weight
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-1">
              <div className="text-2xl font-black text-emerald-700 tracking-tight">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : data.deliveredWeight?.weightFormatted}
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1">Completed consignments</p>
            </div>
          </div>
        </div>

        {/* Row 2 (3 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Card 4: IN TRANSIT WEIGHT */}
          <div
            onClick={() => onCardClick && onCardClick("In Transit Shipments", "despatch", allItems.filter(s => s.status === "In Transit"))}
            className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/90 hover:border-indigo-300 rounded-xl p-4 flex flex-col justify-between transition-all duration-150 cursor-pointer group shadow-2xs hover:shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider group-hover:text-indigo-700 transition-colors">
                In Transit Weight
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center">
                <Truck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-1">
              <div className="text-2xl font-black text-indigo-700 tracking-tight">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : data.inTransitWeight?.weightFormatted}
              </div>
              <p className="text-xs text-indigo-600 font-medium mt-1">Currently on route</p>
            </div>
          </div>

          {/* Card 5: POD PENDING */}
          <div
            onClick={() => onCardClick && onCardClick("POD Pending Shipments", "despatch", allItems.filter(s => s.podStatus !== "Uploaded"))}
            className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/90 hover:border-rose-300 rounded-xl p-4 flex flex-col justify-between transition-all duration-150 cursor-pointer group shadow-2xs hover:shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider group-hover:text-rose-700 transition-colors">
                POD Pending
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-100/70 text-rose-700 flex items-center justify-center">
                <FileWarning className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-1">
              <div className="text-2xl font-black text-rose-700 tracking-tight">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : data.podPending?.count}
              </div>
              <p className="text-xs text-rose-600 font-medium mt-1">Awaiting signed POD receipt</p>
            </div>
          </div>

          {/* Card 6: DESPATCH COST */}
          <div
            onClick={() => onCardClick && onCardClick("Expenses")}
            className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/90 hover:border-amber-300 rounded-xl p-4 flex flex-col justify-between transition-all duration-150 cursor-pointer group shadow-2xs hover:shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider group-hover:text-amber-700 transition-colors">
                Despatch Cost
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-1">
              <div className="text-2xl font-black text-amber-800 tracking-tight">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : data.despatchCost?.amountFormatted}
              </div>
              <p className="text-xs text-amber-700 font-medium mt-1">From recorded trip expenses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DespatchSummarySection;
