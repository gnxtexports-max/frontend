import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "../ui/sheet";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Download, X, Search, Loader2 } from "lucide-react";
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
                  <TableHead>Plant No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Invoices Count</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivered/Cancelled At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                      No historical invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((plant) => (
                    <TableRow key={plant._id} className="hover:bg-muted/10 transition-colors">
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
                    </TableRow>
                  ))
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
