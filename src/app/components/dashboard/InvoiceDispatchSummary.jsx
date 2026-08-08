import React, { useState, useEffect } from "react";
import { CalendarDays, Filter, Loader2, RefreshCw, X, FileText, Truck, Clock, Weight } from "lucide-react";
import { Button } from "../ui/button";

const getRobustApiUrl = () => {
  let raw = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";
  raw = raw.replace(/\/$/, "");
  if (!raw.endsWith("/api")) {
    raw += "/api";
  }
  return raw;
};
const API_BASE_URL = getRobustApiUrl();

export function InvoiceDispatchSummary({ fromDate, toDate }) {
  const [loading, setLoading] = useState(false);

  const [summaryData, setSummaryData] = useState({
    totalInvoices: 0,
    dispatchedInvoices: 0,
    pendingDispatches: 0,
    totalDispatchedWeightFormatted: "0.00 Ton",
  });

  const fetchSummary = async (fDate = fromDate, tDate = toDate) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fDate) params.append("fromDate", fDate);
      if (tDate) params.append("toDate", tDate);

      const res = await fetch(`${API_BASE_URL}/dashboard/summary?${params.toString()}`, {
        credentials: "include",
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSummaryData(result.data);
      }
    } catch (err) {
      console.error("Error fetching dashboard summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(fromDate, toDate);
  }, [fromDate, toDate]);

  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1d4ed8]" />
            Invoice & Dispatch Summary
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Date-based reporting metrics & dispatched volume summary
          </p>
        </div>
      </div>

      {/* Horizontal Divider */}
      <div className="border-t border-border pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Invoices */}
          <div className="bg-slate-50/50 border border-slate-200/80 rounded-lg p-4 flex flex-col justify-between transition-all hover:bg-slate-50 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoices</span>
              <div className="w-8 h-8 rounded-full bg-blue-100/80 flex items-center justify-center text-blue-600">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : summaryData.totalInvoices}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Within selected range</p>
            </div>
          </div>

          {/* Card 2: Dispatched Invoices */}
          <div className="bg-slate-50/50 border border-slate-200/80 rounded-lg p-4 flex flex-col justify-between transition-all hover:bg-slate-50 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispatched Invoices</span>
              <div className="w-8 h-8 rounded-full bg-emerald-100/80 flex items-center justify-center text-emerald-600">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : summaryData.dispatchedInvoices}
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">In Transit / Delivered / Closed</p>
            </div>
          </div>

          {/* Card 3: Pending Dispatches */}
          <div className="bg-slate-50/50 border border-slate-200/80 rounded-lg p-4 flex flex-col justify-between transition-all hover:bg-slate-50 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Dispatches</span>
              <div className="w-8 h-8 rounded-full bg-amber-100/80 flex items-center justify-center text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : summaryData.pendingDispatches}
              </div>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Awaiting Shipment / Assigned</p>
            </div>
          </div>

          {/* Card 4: Total Dispatched Weight */}
          <div className="bg-slate-50/50 border border-slate-200/80 rounded-lg p-4 flex flex-col justify-between transition-all hover:bg-slate-50 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispatched Weight</span>
              <div className="w-8 h-8 rounded-full bg-purple-100/80 flex items-center justify-center text-purple-600">
                <Weight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : summaryData.totalDispatchedWeightFormatted}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Cumulative weight</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceDispatchSummary;
