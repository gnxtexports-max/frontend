import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Search,
  Plus,
  CalendarDays,
  X,
  Upload,
  FileText,
  Trash2,
  Pencil,
  Check,
  Truck,
  Wrench,
  Package,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import {
  DISPATCH_EXPENSE_TYPES,
  MAINTENANCE_EXPENSE_TYPES,
} from "./data/expensesData";

export function AddExpenseModal({
  open,
  onOpenChange,
  tripId,
  lr,
  onSave,
  shipments = [],
}) {
  // Category state: "dispatch" or "maintenance"
  const [category, setCategory] = useState("dispatch");

  // Dispatch header context
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [shipmentSearch, setShipmentSearch] = useState("");
  const [shipmentDropdownOpen, setShipmentDropdownOpen] = useState(false);

  // Maintenance header context
  const [selectedVehicle, setSelectedVehicle] = useState("");

  // Staged saved entries: Array of { id, date, expenseType, amount, notes, receiptUrl }
  const [savedEntries, setSavedEntries] = useState([]);

  // Active entry input form state
  const [editingId, setEditingId] = useState(null);
  const [entryDate, setEntryDate] = useState(new Date());
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [expenseType, setExpenseType] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Unique vehicle numbers from shipments for maintenance dropdown
  const vehicleList = Array.from(
    new Set(shipments.map((s) => s.vehicleNumber || s.vehicleId).filter(Boolean))
  );

  // Reset active form
  const resetActiveEntryForm = () => {
    setEditingId(null);
    setEntryDate(new Date());
    setExpenseType("");
    setAmount("");
    setNotes("");
    setReceiptUrl("");
    setUploading(false);
  };

  // Reset modal on open
  useEffect(() => {
    if (open) {
      setCategory("dispatch");
      setSavedEntries([]);
      resetActiveEntryForm();
      setShipmentSearch("");

      const targetTripId =
        tripId ||
        (lr
          ? shipments.find((s) => s.destinations?.some((d) => d.lrNumber === lr))
              ?.shipmentId
          : null);

      if (targetTripId) {
        const foundShipment = shipments.find((s) => s.shipmentId === targetTripId);
        if (foundShipment) {
          setSelectedShipment(foundShipment);
          setSelectedVehicle(foundShipment.vehicleNumber || foundShipment.vehicleId || "");
        } else {
          setSelectedShipment(null);
          setSelectedVehicle("");
        }
      } else {
        setSelectedShipment(null);
        setSelectedVehicle("");
      }
    }
  }, [open, tripId, lr, shipments]);

  const filteredShipments = shipments.filter(
    (s) =>
      s.shipmentId?.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.driverName?.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.vehicleNumber?.toLowerCase().includes(shipmentSearch.toLowerCase())
  );

  // Available expense types based on selected category
  const activeExpenseTypes =
    category === "dispatch" ? DISPATCH_EXPENSE_TYPES : MAINTENANCE_EXPENSE_TYPES;

  // File upload handler (immediate Base64 conversion)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(`"${file.name}" exceeds the 5MB limit.`);
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setReceiptUrl(ev.target.result);
        }
        setUploading(false);
      };
      reader.onerror = () => {
        alert("Failed to read file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File processing error:", err);
      alert("Failed to process file");
      setUploading(false);
    }
  };

  // Add or update entry in staged list
  const handleSaveEntry = () => {
    if (!expenseType) {
      alert("Please select an Expense Type.");
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    if (editingId) {
      // Update existing entry
      setSavedEntries((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                date: entryDate,
                expenseType,
                amount: numericAmount,
                notes,
                receiptUrl,
              }
            : e
        )
      );
    } else {
      // Add new entry
      const newEntry = {
        id: crypto.randomUUID(),
        date: entryDate,
        expenseType,
        amount: numericAmount,
        notes,
        receiptUrl,
      };
      setSavedEntries((prev) => [...prev, newEntry]);
    }

    resetActiveEntryForm();
  };

  // Edit staged entry
  const handleEditEntry = (entry) => {
    setEditingId(entry.id);
    setEntryDate(new Date(entry.date));
    setExpenseType(entry.expenseType);
    setAmount(entry.amount.toString());
    setNotes(entry.notes || "");
    setReceiptUrl(entry.receiptUrl || "");
  };

  // Delete staged entry
  const handleDeleteEntry = (id) => {
    setSavedEntries((prev) => prev.filter((e) => e.id !== id));
    if (editingId === id) {
      resetActiveEntryForm();
    }
  };

  // Compute total of saved entries
  const totalAmount = savedEntries.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Submit all staged entries to backend
  const handleFinalSave = async () => {
    if (category === "dispatch" && !selectedShipment) {
      alert("Please select a Shipment ID for Dispatch Expenses.");
      return;
    }
    if (category === "maintenance" && !selectedVehicle) {
      alert("Please select or enter a Vehicle Number for Maintenance Expenses.");
      return;
    }

    if (savedEntries.length === 0) {
      alert("Please add and save at least one expense entry before final submission.");
      return;
    }

    const payload = {
      category,
      tripId: category === "dispatch" ? selectedShipment?.shipmentId : "",
      shipmentId: category === "dispatch" ? selectedShipment?._id : undefined,
      vehicleId:
        category === "dispatch"
          ? selectedShipment?.vehicleId || selectedShipment?.vehicleNumber
          : selectedVehicle,
      vehicleNo:
        category === "dispatch" ? selectedShipment?.vehicleNumber : selectedVehicle,
      driverName: category === "dispatch" ? selectedShipment?.driverName : "",
      entries: savedEntries.map((e) => ({
        category,
        lrNumber: category === "dispatch" ? selectedShipment?.destinations?.[0]?.lrNumber || "" : "",
        date: format(e.date, "yyyy-MM-dd"),
        notes: e.notes || "",
        receiptUrl: e.receiptUrl || "",
        items: [
          {
            expenseType: e.expenseType,
            amount: e.amount,
            description: e.notes || "",
          },
        ],
      })),
    };

    await onSave(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white border border-border shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border bg-[#fafbfc]">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            ADD TRIP EXPENSES
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Categorize and log trip or vehicle maintenance expense entries.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Expense Category Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Expense Category *
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setCategory("dispatch");
                  setExpenseType("");
                  setSavedEntries([]);
                  resetActiveEntryForm();
                }}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                  category === "dispatch"
                    ? "border-[#1d4ed8] bg-blue-50/60 ring-1 ring-[#1d4ed8]"
                    : "border-border hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    category === "dispatch"
                      ? "border-[#1d4ed8] bg-[#1d4ed8]"
                      : "border-slate-300"
                  }`}
                >
                  {category === "dispatch" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#1d4ed8]" />
                    Dispatch Expenses
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Shipment & trip-based operational costs
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory("maintenance");
                  setExpenseType("");
                  setSavedEntries([]);
                  resetActiveEntryForm();
                }}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                  category === "maintenance"
                    ? "border-purple-600 bg-purple-50/60 ring-1 ring-purple-600"
                    : "border-border hover:bg-[#fafbfc]"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    category === "maintenance"
                      ? "border-purple-600 bg-purple-600"
                      : "border-slate-300"
                  }`}
                >
                  {category === "maintenance" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-purple-600" />
                    Maintenance Expenses
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Vehicle-based repairs, taxes & servicing
                  </p>
                </div>
              </button>
            </div>
          </div>

          <Separator />

          {/* Context Header Fields */}
          {category === "dispatch" ? (
            <div className="bg-[#fafbfc] border border-border rounded-xl p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#1d4ed8]" /> DISPATCH DETAILS
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Shipment / Trip ID Selection */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Shipment / Trip ID *
                  </Label>
                  <Popover open={shipmentDropdownOpen} onOpenChange={setShipmentDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-9 text-xs bg-white border-border"
                      >
                        <span className="truncate">{selectedShipment ? selectedShipment.shipmentId : "Select Shipment..."}</span>
                        <Search className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-2 bg-white shadow-xl border border-border" align="start">
                      <div className="space-y-2">
                        <Input
                          placeholder="Search shipment ID, vehicle..."
                          value={shipmentSearch}
                          onChange={(e) => setShipmentSearch(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {filteredShipments.length === 0 ? (
                            <p className="text-xs text-muted-foreground p-2 text-center">No shipments found</p>
                          ) : (
                            filteredShipments.map((s) => (
                              <button
                                key={s.shipmentId}
                                onClick={() => {
                                  setSelectedShipment(s);
                                  setShipmentDropdownOpen(false);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-slate-100 transition-colors flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-semibold text-foreground">{s.shipmentId}</span>
                                  <p className="text-[10px] text-muted-foreground">{s.driverName} • {s.vehicleNumber}</p>
                                </div>
                                {selectedShipment?.shipmentId === s.shipmentId && (
                                  <Check className="w-3.5 h-3.5 text-[#1d4ed8]" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Vehicle No (Auto-filled) */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Vehicle No</Label>
                  <Input
                    readOnly
                    value={selectedShipment?.vehicleNumber || selectedShipment?.vehicleId || "—"}
                    className="h-9 bg-slate-100/80 border-border text-xs text-slate-700 font-medium"
                  />
                </div>

                {/* Driver (Auto-filled) */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Driver</Label>
                  <Input
                    readOnly
                    value={selectedShipment?.driverName || "—"}
                    className="h-9 bg-slate-100/80 border-border text-xs text-slate-700 font-medium"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#fafbfc] border border-border rounded-xl p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-600" /> MAINTENANCE DETAILS
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vehicle Selection */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Vehicle ID / Number *</Label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger className="h-9 bg-white border-border text-xs">
                      <SelectValue placeholder="Select Vehicle Number..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleList.map((v) => (
                        <SelectItem key={v} value={v} className="text-xs">
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Active Expense Entry Input Form */}
          <div className="bg-white border border-border rounded-xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {editingId ? "Edit Expense Entry" : "Expense Entry"}
              </h4>
              {editingId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetActiveEntryForm}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel Editing
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Date</Label>
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-9 text-xs bg-white border-border">
                      {entryDate ? format(entryDate, "dd MMM yyyy") : "Select Date"}
                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white" align="start">
                    <Calendar
                      mode="single"
                      selected={entryDate}
                      onSelect={(d) => {
                        if (d) setEntryDate(d);
                        setDatePopoverOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Expense Type Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Expense Type ▼</Label>
                <Select value={expenseType} onValueChange={setExpenseType}>
                  <SelectTrigger className="h-9 bg-white border-border text-xs w-full">
                    <SelectValue placeholder="Select Expense Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeExpenseTypes.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Amount (₹) *</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    className="pl-6 h-9 bg-white border-border text-xs"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Notes / Description */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                  {category === "dispatch" ? "Notes" : "Description"}
                </Label>
                <Textarea
                  placeholder={`Enter details for this ${category} entry...`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-white border-border resize-none h-[75px] text-xs"
                />
              </div>

              {/* File Attachment */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Attachment</Label>
                <div
                  className="border border-dashed border-slate-300 rounded-lg p-2.5 text-center hover:border-[#1d4ed8]/40 hover:bg-slate-50 transition-colors cursor-pointer relative h-[75px] flex flex-col justify-center items-center"
                  onClick={() => document.getElementById("entry-file-upload").click()}
                >
                  <input
                    id="entry-file-upload"
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileUpload}
                  />
                  {uploading ? (
                    <p className="text-xs text-muted-foreground">Uploading...</p>
                  ) : receiptUrl ? (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#1d4ed8]" />
                      <span className="text-xs text-[#1d4ed8] font-medium">Attachment Ready ✅</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReceiptUrl("");
                        }}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">
                        Click to upload bill / receipt <span className="text-muted-foreground/60">(5MB limit)</span>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Save Entry Action */}
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                onClick={handleSaveEntry}
                className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-semibold px-5 h-9"
              >
                {editingId ? "Update Entry" : "[ Save Entry ]"}
              </Button>
            </div>
          </div>

          {/* Staged Saved Entries Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Saved Entries ({savedEntries.length})</h4>
            </div>

            {savedEntries.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl py-6 text-center">
                <p className="text-xs text-muted-foreground">No saved entries yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Fill entry details above and click <strong>[ Save Entry ]</strong> to stage items.
                </p>
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#fafbfc] text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Expense Type</th>
                      <th className="px-4 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Notes / File</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {savedEntries.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-700">
                          {format(new Date(e.date), "dd MMM yyyy")}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className="text-[11px] px-2 py-0.5 border-slate-200">
                            {e.expenseType}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">
                          ₹{e.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 max-w-[200px] truncate">
                          {e.notes || "—"} {e.receiptUrl && "📎"}
                        </td>
                        <td className="px-4 py-2.5 text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-slate-500 hover:text-[#1d4ed8]"
                            onClick={() => handleEditEntry(e)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-slate-500 hover:text-red-600"
                            onClick={() => handleDeleteEntry(e.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Separator />

          {/* TOTAL EXPENSE BANNER */}
          <div className="flex items-center justify-between bg-[#f0f4ff] border border-[#1d4ed8]/20 rounded-xl px-5 py-3.5">
            <span className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wide">
              TOTAL {category.toUpperCase()} EXPENSE
            </span>
            <span className="text-base font-bold text-[#1d4ed8] tabular-nums">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-[#fafbfc]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            onClick={handleFinalSave}
            className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-semibold gap-2 h-9 px-5"
          >
            <Plus className="w-3.5 h-3.5" />
            {category === "dispatch"
              ? `Save Trip Expenses (${savedEntries.length})`
              : `Save Maintenance Expenses (${savedEntries.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default AddExpenseModal;
