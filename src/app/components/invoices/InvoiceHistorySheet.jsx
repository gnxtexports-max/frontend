import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "../ui/sheet";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Download, X, Search, Loader2, ChevronDown, ChevronRight, CornerUpLeft } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

export function InvoiceHistorySheet({ open, onOpenChange }) {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleReturnInvoice = async (invoiceId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: "Reassignment" }),
      });
      const result = await res.json();
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("api-cache-updated"));
        return true;
      } else {
        alert(result.message || "Failed to return invoice");
        return false;
      }
    } catch (err) {
      console.error("Error returning invoice:", err);
      return false;
    }
  };

  const fetchHistory = async (search = "", page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        page,
        limit: 15,
      });

      const res = await fetch(`${API_BASE_URL}/invoices/history?${params}`, {
        credentials: "include",
      });
      const result = await res.json();

      if (res.ok) {
        setInvoices(result.data || []);
        setTotal(result.pagination?.total || 0);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching invoice history:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when opened or when dependencies change
  useEffect(() => {
    if (open && token) {
      fetchHistory(searchQuery, currentPage);
    }
  }, [open, searchQuery, currentPage, token]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-4xl overflow-y-auto flex flex-col h-full bg-white p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5 shrink-0 bg-white -mx-6 -mt-6 px-6 pt-6 shadow-sm">
          <div>
            <SheetTitle className="text-xl font-bold tracking-tight text-foreground">Invoices History</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground mt-1">
              View delivered plants and invoices.
            </SheetDescription>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm mb-5 shrink-0">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Plant No, Customer, or Invoice #..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-sm bg-slate-50/50 border-border"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl border border-border shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-auto relative">
            {loading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50">
                <Loader2 className="w-6 h-6 animate-spin text-[#1d4ed8]" />
              </div>
            )}
            <Table>
              <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-8 pl-4" />
                  <TableHead>Plant No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Invoices Count</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivered/Cancelled At</TableHead>
                  <TableHead className="text-right pr-4">Return</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                      No historical invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((plant) => {
                    const isExpanded = !!expandedRows[plant._id];
                    const hasInvoices = plant.invoices && plant.invoices.length > 0;

                    return (
                      <React.Fragment key={plant._id}>
                        <TableRow 
                          className="hover:bg-muted/10 transition-colors cursor-pointer"
                          onClick={() => hasInvoices && toggleRow(plant._id)}
                        >
                          <TableCell className="pl-4 w-8">
                            {hasInvoices ? (
                              isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )
                            ) : null}
                          </TableCell>
                          <TableCell className="font-semibold text-[#1d4ed8] text-xs">
                            {plant.plantNumber}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-800">
                            {plant.customerName || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {plant.location || "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {plant.invoices?.length || 0} Invoices
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={plant.status} />
                          </TableCell>
                          <TableCell className="text-[11px] text-slate-500 font-medium">
                            {plant.status === "Cancelled"
                              ? (plant.cancelledAt ? new Date(plant.cancelledAt).toLocaleString("en-IN") : "—")
                              : (plant.deliveredAt ? new Date(plant.deliveredAt).toLocaleString("en-IN") : "—")}
                          </TableCell>
                          <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                             {plant.status === "Cancelled" ? (
                               <Button
                                 variant="outline"
                                 size="sm"
                                 className="h-7 text-[10px] font-semibold bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-2 rounded-md inline-flex items-center gap-1"
                                 onClick={async () => {
                                   const confirmReturn = window.confirm(`Are you sure you want to return all ${plant.invoices?.length || 0} invoices for Plant ${plant.plantNumber}?`);
                                   if (!confirmReturn) return;
                                   let anySuccess = false;
                                   for (const inv of plant.invoices || []) {
                                     const ok = await handleReturnInvoice(inv._id);
                                     if (ok) anySuccess = true;
                                   }
                                   if (anySuccess) {
                                     fetchHistory(searchQuery, currentPage);
                                   }
                                 }}
                               >
                                 <CornerUpLeft className="w-3 h-3" />
                                 Return All
                               </Button>
                             ) : (
                               <span className="text-xs text-muted-foreground">—</span>
                             )}
                          </TableCell>
                        </TableRow>

                        {isExpanded && hasInvoices && (
                          plant.invoices.map((inv) => (
                            <TableRow key={inv._id} className="bg-slate-50/40 hover:bg-slate-50/70 border-l-2 border-indigo-500">
                              <TableCell className="pl-4 w-8" />
                              <TableCell className="text-[10px] text-slate-400 font-mono">Invoice Item</TableCell>
                              <TableCell className="text-xs text-[#1d4ed8] font-semibold">{inv.invoiceNumber}</TableCell>
                              <TableCell className="text-[10px] text-slate-400">Date: {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}</TableCell>
                              <TableCell className="text-xs text-slate-600 font-medium">Qty: {inv.quantity || 0} | Wt: {inv.weight || 0} kg</TableCell>
                              <TableCell>
                                <StatusBadge status={inv.status} />
                              </TableCell>
                              <TableCell className="text-[11px] text-slate-500 font-medium">
                                {inv.status === "Cancelled"
                                  ? (inv.cancelledAt ? new Date(inv.cancelledAt).toLocaleString("en-IN") : "—")
                                  : (inv.deliveredAt ? new Date(inv.deliveredAt).toLocaleString("en-IN") : "—")}
                              </TableCell>
                              <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px] font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 px-2 rounded-md inline-flex items-center gap-1 shadow-sm"
                                  onClick={async () => {
                                    const confirmReturn = window.confirm(`Are you sure you want to return Invoice ${inv.invoiceNumber} to the active list?`);
                                    if (confirmReturn) {
                                      const ok = await handleReturnInvoice(inv._id);
                                      if (ok) {
                                        fetchHistory(searchQuery, currentPage);
                                      }
                                    }
                                  }}
                                >
                                  <CornerUpLeft className="w-3 h-3" />
                                  Return
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20 shrink-0">
            <p className="text-xs text-muted-foreground">
              Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
              <span className="font-medium text-foreground">{totalPages}</span> —{" "}
              <span className="font-medium text-foreground">{total}</span> plants
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Prev
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default InvoiceHistorySheet;
