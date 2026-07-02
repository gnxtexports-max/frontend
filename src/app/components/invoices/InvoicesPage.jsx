import { useEffect, useState } from "react";
import InvoiceHeader from "./InvoiceHeader";
import InvoiceFiltersBar from "./InvoiceFiltersBar";
import InvoiceTable from "./InvoiceTable";
import { AlertCircle, X } from "lucide-react";
import { Button } from "../ui/button";
import InvoiceHistorySheet from "./InvoiceHistorySheet";
import { useAuth } from "../../context/AuthContext";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

const itemsPerPage = 15;

export function InvoicesPage() {
  const { user, token, hasPermission, hasGranularPermission } = useAuth();
  const canCreate = hasPermission("Invoices", "create");
  const canEdit =
    hasGranularPermission("cancel_invoice") ||
    hasPermission("Invoices", "delete") ||
    hasPermission("Invoices", "edit");
  const canDelete = user?.role === "Super Admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrorData, setValidationErrorData] = useState(null);

  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Manual Add Invoice modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState({
    plantNumber: "",
    customerName: "",
    location: "",
    invoiceNumber: "",
    invoiceDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoices = async (
    search = "",
    status = "All",
    page = 1,
    hideLoading = false
  ) => {
    if (!hideLoading) {
      setLoading(true);
    }
    setError("");

    try {
      const params = new URLSearchParams({
        search,
        status: status === "All" ? "" : status,
        page,
        limit: itemsPerPage,
      });

      const res = await fetch(
        `${API_BASE_URL}/invoices?${params}`,
        { credentials: "include" }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message);
      }

      setInvoices(result.data || []);
      setTotal(result.pagination.total || 0);
      setTotalPages(result.pagination.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchInvoices(searchQuery, statusFilter, currentPage);
  }, [currentPage, token]);

  useEffect(() => {
    if (!token) return;
    setCurrentPage(1);
    fetchInvoices(searchQuery, statusFilter, 1);
  }, [searchQuery, statusFilter, token]);

  // Silent refresh on cache updates
  useEffect(() => {
    if (!token) return;
    const handler = () => fetchInvoices(searchQuery, statusFilter, currentPage, true);
    window.addEventListener("api-cache-updated", handler);
    return () => window.removeEventListener("api-cache-updated", handler);
  }, [searchQuery, statusFilter, currentPage, token]);

  // Auto-refresh removed — real-time updates via socket events
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid Excel or CSV file");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");
    setValidationErrorData(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${API_BASE_URL}/invoices/upload`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const result = await res.json();

      if (!res.ok) {
        if (result.validationError) {
          setValidationErrorData({
            missingColumns: result.missingColumns || [],
            headers: result.headers || [],
          });
        } else {
          throw new Error(result.message || "Upload failed");
        }
        return;
      }

      setSuccess(
        `✅ ${result.data.invoicesAdded} invoices uploaded successfully`
      );

      fetchInvoices(searchQuery, statusFilter, currentPage);

      setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleted = (invoiceId) => {
    setInvoices((prev) =>
      prev
        .map((plant) => ({
          ...plant,
          invoices: plant.invoices.filter(
            (inv) => inv._id !== invoiceId
          ),
        }))
        .filter((plant) => plant.invoices.length > 0)
    );
  };

  const handleStatusUpdated = (invoiceId, newStatus) => {
    setInvoices((prev) =>
      prev.map((plant) => ({
        ...plant,
        invoices: plant.invoices.map((inv) =>
          inv._id === invoiceId ? { ...inv, status: newStatus } : inv
        ),
      }))
    );
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE_URL}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newInvoiceData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to add invoice");
      }

      setSuccess("✅ Invoice added successfully");
      setAddModalOpen(false);
      setNewInvoiceData({
        plantNumber: "",
        customerName: "",
        location: "",
        invoiceNumber: "",
        invoiceDate: "",
      });
      fetchInvoices(searchQuery, statusFilter, currentPage);

      setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <InvoiceHeader
        total={total}
        uploading={uploading}
        onFileUpload={handleFileUpload}
        onHistoryClick={() => setHistoryOpen(true)}
        onAddClick={() => setAddModalOpen(true)}
        canCreate={canCreate}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {validationErrorData && (
        <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-5 text-red-800 text-sm space-y-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 text-base">Invalid Excel Sheet Format</h3>
                <p className="text-xs text-red-700/90 mt-0.5">
                  The system was unable to automatically map some of the required columns. Please adjust your spreadsheet headers and try again.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setValidationErrorData(null)}
              className="text-red-700 hover:bg-red-100/50 hover:text-red-900 h-8 px-2 flex items-center"
            >
              <X className="w-4 h-4 mr-1.5" /> Dismiss
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-2">
            {[
              {
                id: "Plant Reference",
                label: "Plant Reference",
                keywords: "Plant, Plant No, Plant Reference Number",
              },
              {
                id: "Customer Name",
                label: "Customer Name",
                keywords: "Customer Name, Customer",
              },
              {
                id: "Invoice Number",
                label: "Invoice Number",
                keywords: "Invoice, Invoice No, Invoice Number, Invoice #",
              },
              {
                id: "Invoice Date",
                label: "Invoice Date",
                keywords: "Invoice Date, Date, Invoice Dt",
              },
              {
                id: "Location",
                label: "Location",
                keywords: "District, Location, Customer Location, Delivery Location, City, Address",
              },
            ].map((col) => {
              const isMissing = validationErrorData.missingColumns.includes(col.id);
              return (
                <div
                  key={col.id}
                  className={`p-3.5 border rounded-xl flex flex-col justify-between gap-2.5 transition-all ${
                    isMissing
                      ? "bg-red-50/50 border-red-200 shadow-inner"
                      : "bg-emerald-50/50 border-emerald-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${isMissing ? "text-red-950" : "text-emerald-950"}`}>
                      {col.label}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                        isMissing
                          ? "bg-red-200/60 text-red-800"
                          : "bg-emerald-200/60 text-emerald-800"
                      }`}
                    >
                      {isMissing ? "Missing" : "Matched"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground block font-medium">Accepted terms:</span>
                    <span className="text-[10px] font-mono leading-relaxed block truncate text-slate-600" title={col.keywords}>
                      {col.keywords}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {validationErrorData.headers?.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-red-200/50">
              <span className="text-xs font-semibold text-slate-700 block">
                📋 Headers Detected in Sheet ({validationErrorData.headers.length}):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {validationErrorData.headers.map((h, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-1 bg-white border border-red-100 rounded text-slate-600 shadow-sm"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
          {success}
        </div>
      )}

      <InvoiceFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <InvoiceTable
        invoices={invoices}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        onPageChange={setCurrentPage}
        onDeleted={handleDeleted}
        onStatusUpdated={handleStatusUpdated}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      <InvoiceHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />

      {/* Manual Add Invoice Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-border shadow-lg rounded-xl p-6">
          <DialogHeader className="border-b border-border pb-3 mb-4">
            <DialogTitle className="text-lg font-bold text-foreground">Add New Invoice</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Manually record a new customer invoice record.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddInvoice} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plantNumber" className="text-xs font-semibold text-slate-700">Plant No. *</Label>
                <Input
                  id="plantNumber"
                  required
                  placeholder="e.g. 1109461889"
                  value={newInvoiceData.plantNumber}
                  onChange={(e) => setNewInvoiceData(prev => ({ ...prev, plantNumber: e.target.value }))}
                  className="h-9 bg-slate-50 border-border text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customerName" className="text-xs font-semibold text-slate-700">Customer Name *</Label>
                <Input
                  id="customerName"
                  required
                  placeholder="e.g. SUNLUBE MARKETING"
                  value={newInvoiceData.customerName}
                  onChange={(e) => setNewInvoiceData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="h-9 bg-slate-50 border-border text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-semibold text-slate-700">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Kollam"
                  value={newInvoiceData.location}
                  onChange={(e) => setNewInvoiceData(prev => ({ ...prev, location: e.target.value }))}
                  className="h-9 bg-slate-50 border-border text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invoiceNumber" className="text-xs font-semibold text-slate-700">Invoice Number *</Label>
                <Input
                  id="invoiceNumber"
                  required
                  placeholder="e.g. 9354794370"
                  value={newInvoiceData.invoiceNumber}
                  onChange={(e) => setNewInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  className="h-9 bg-slate-50 border-border text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invoiceDate" className="text-xs font-semibold text-slate-700">Invoice Date *</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  required
                  value={newInvoiceData.invoiceDate}
                  onChange={(e) => setNewInvoiceData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                  className="h-9 bg-slate-50 border-border text-sm"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                className="h-9 text-xs border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-9 text-xs bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-medium"
              >
                {submitting ? "Adding..." : "Add Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InvoicesPage;