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
  Briefcase,
  Loader2,
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
  MISCELLANEOUS_EXPENSE_TYPES,
} from "./data/expensesData";

export function AddExpenseModal({
  open,
  onOpenChange,
  tripId,
  lr,
  onSave,
  shipments = [],
}) {
  // Category state: "dispatch" | "maintenance" | "miscellaneous"
  const [category, setCategory] = useState("dispatch");

  // Dispatch header context
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [dispatchDateFilter, setDispatchDateFilter] = useState(null);
  const [dispatchDateOpen, setDispatchDateOpen] = useState(false);
  const [shipmentSearch, setShipmentSearch] = useState("");
  const [shipmentDropdownOpen, setShipmentDropdownOpen] = useState(false);
  const [km, setKm] = useState("");

  // Maintenance header context
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [maintenanceDriver, setMaintenanceDriver] = useState("");

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
  const [submitting, setSubmitting] = useState(false);

  // Unique vehicle numbers from shipments for maintenance dropdown
  const vehicleList = Array.from(
    new Set(shipments.map((s) => s.vehicleNumber || s.vehicleId).filter(Boolean))
  );

  // Unique driver names from shipments
  const driverList = Array.from(
    new Set(shipments.map((s) => s.driverName).filter(Boolean))
  );

  // Auto-calculated weight for selected shipment
  const autoWeight = selectedShipment
    ? selectedShipment.totalWeightKg ||
      (selectedShipment.destinations || []).reduce(
        (sum, d) => sum + (Number(d.weightKg) || 0),
        0
      )
    : 0;

  // Handle vehicle selection in maintenance mode
  const handleVehicleChange = (v) => {
    setSelectedVehicle(v);
    const matchedShipment = shipments.find(
      (s) => (s.vehicleNumber === v || s.vehicleId === v) && s.driverName
    );
    if (matchedShipment && !maintenanceDriver) {
      setMaintenanceDriver(matchedShipment.driverName);
    }
  };

  // Reset active form
  const resetActiveEntryForm = (targetShipment = selectedShipment, targetDate = dispatchDateFilter) => {
    setEditingId(null);
    if (targetShipment) {
      const sDate = targetShipment.dispatchDate || targetShipment.createdAt;
      setEntryDate(sDate ? new Date(sDate) : (targetDate || new Date()));
    } else if (targetDate) {
      setEntryDate(targetDate);
    } else {
      setEntryDate(new Date());
    }
    setExpenseType("");
    setAmount("");
    setNotes("");
    setReceiptUrl("");
    setUploading(false);
  };

  // Select shipment handler: synchronizes dispatch date and expense entry date
  const handleSelectShipment = (shipment) => {
    setSelectedShipment(shipment);
    setShipmentDropdownOpen(false);
    if (shipment) {
      const sDate = shipment.dispatchDate || shipment.createdAt;
      if (sDate) {
        const parsed = new Date(sDate);
        setDispatchDateFilter(parsed);
        setEntryDate(parsed);
      }
    }
  };

  // Select dispatch date handler: filters shipments to that date and syncs entry date
  const handleSelectDispatchDate = (date) => {
    if (!date) return;
    setDispatchDateFilter(date);
    setDispatchDateOpen(false);
    setEntryDate(date);

    const dateStr = format(date, "yyyy-MM-dd");
    const matchesOnDate = shipments.filter((s) => {
      const raw = s.dispatchDate || s.createdAt;
      return raw && format(new Date(raw), "yyyy-MM-dd") === dateStr;
    });

    if (matchesOnDate.length === 1) {
      setSelectedShipment(matchesOnDate[0]);
    } else if (selectedShipment) {
      const curRaw = selectedShipment.dispatchDate || selectedShipment.createdAt;
      const curStr = curRaw ? format(new Date(curRaw), "yyyy-MM-dd") : "";
      if (curStr !== dateStr) {
        setSelectedShipment(null);
      }
    }
  };

  // Clear dispatch date filter
  const handleClearDispatchDate = () => {
    setDispatchDateFilter(null);
  };

  // Reset modal on open
  useEffect(() => {
    if (open) {
      setCategory("dispatch");
      setSavedEntries([]);
      setShipmentSearch("");
      setKm("");
      setMaintenanceDriver("");
      setDispatchDateFilter(null);

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
          setMaintenanceDriver(foundShipment.driverName || "");
          const sDate = foundShipment.dispatchDate || foundShipment.createdAt;
          const parsed = sDate ? new Date(sDate) : null;
          setDispatchDateFilter(parsed);
          resetActiveEntryForm(foundShipment, parsed);
        } else {
          setSelectedShipment(null);
          setSelectedVehicle("");
          setMaintenanceDriver("");
          resetActiveEntryForm(null, null);
        }
      } else {
        setSelectedShipment(null);
        setSelectedVehicle("");
        setMaintenanceDriver("");
        resetActiveEntryForm(null, null);
      }
    }
  }, [open, tripId, lr, shipments]);

  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      !shipmentSearch ||
      s.shipmentId?.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.driverName?.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.vehicleNumber?.toLowerCase().includes(shipmentSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (dispatchDateFilter) {
      const raw = s.dispatchDate || s.createdAt;
      if (!raw) return false;
      return format(new Date(raw), "yyyy-MM-dd") === format(dispatchDateFilter, "yyyy-MM-dd");
    }

    return true;
  });

  // Available expense types based on selected category
  const activeExpenseTypes =
    category === "dispatch"
      ? DISPATCH_EXPENSE_TYPES
      : category === "maintenance"
      ? MAINTENANCE_EXPENSE_TYPES
      : MISCELLANEOUS_EXPENSE_TYPES;

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
          : category === "maintenance"
          ? selectedVehicle
          : "",
      vehicleNo:
        category === "dispatch"
          ? selectedShipment?.vehicleNumber
          : category === "maintenance"
          ? selectedVehicle
          : "",
      driverName:
        category === "dispatch"
          ? selectedShipment?.driverName
          : category === "maintenance"
          ? maintenanceDriver
          : "",
      weight: category === "dispatch" ? autoWeight : 0,
      km: category === "dispatch" ? Number(km) || 0 : 0,
      entries: savedEntries.map((e) => ({
        category,
        lrNumber:
          category === "dispatch"
            ? selectedShipment?.destinations?.[0]?.lrNumber || ""
            : "",
        date: format(e.date, "yyyy-MM-dd"),
        notes: e.notes || "",
        receiptUrl: e.receiptUrl || "",
        driverName:
          category === "maintenance"
            ? maintenanceDriver
            : category === "dispatch"
            ? selectedShipment?.driverName
            : "",
        weight: category === "dispatch" ? autoWeight : 0,
        km: category === "dispatch" ? Number(km) || 0 : 0,
        items: [
          {
            expenseType: e.expenseType,
            amount: e.amount,
            description: e.notes || "",
          },
        ],
      })),
    };

    if (submitting) return;
    setSubmitting(true);
    try {
      await onSave(payload);
      onOpenChange(false);
    } catch (err) {
      console.error("Save expense error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl md:max-w-5xl bg-white border border-border shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border bg-[#fafbfc]">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            ADD TRIP EXPENSES
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Categorize and log trip, vehicle maintenance, or miscellaneous expense entries.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Expense Category Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Expense Category *
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Dispatch Expenses */}
              <button
                type="button"
                onClick={() => {
                  setCategory("dispatch");
                  setExpenseType("");
                  setSavedEntries([]);
                  resetActiveEntryForm(selectedShipment, dispatchDateFilter);
                }}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
                  category === "dispatch"
                    ? "border-[#1d4ed8] bg-blue-50/70 ring-1 ring-[#1d4ed8]"
                    : "border-border hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
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
                    Shipment & trip operational costs
                  </p>
                </div>
              </button>

              {/* 2. Maintenance Expenses */}
              <button
                type="button"
                onClick={() => {
                  setCategory("maintenance");
                  setExpenseType("");
                  setSavedEntries([]);
                  resetActiveEntryForm(null, null);
                }}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
                  category === "maintenance"
                    ? "border-purple-600 bg-purple-50/70 ring-1 ring-purple-600"
                    : "border-border hover:bg-[#fafbfc]"
                }`}
              >
                <div
                  className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
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
                    Vehicle repairs, taxes & servicing
                  </p>
                </div>
              </button>

              {/* 3. Miscellaneous Expenses */}
              <button
                type="button"
                onClick={() => {
                  setCategory("miscellaneous");
                  setExpenseType("");
                  setSavedEntries([]);
                  resetActiveEntryForm(null, null);
                }}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
                  category === "miscellaneous"
                    ? "border-amber-600 bg-amber-50/70 ring-1 ring-amber-600"
                    : "border-border hover:bg-[#fafbfc]"
                }`}
              >
                <div
                  className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                    category === "miscellaneous"
                      ? "border-amber-600 bg-amber-600"
                      : "border-slate-300"
                  }`}
                >
                  {category === "miscellaneous" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-amber-600" />
                    Misc Expenses
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    General, office & other costs
                  </p>
                </div>
              </button>
            </div>
          </div>

          <Separator />

          {/* Context Header Fields */}
          {category === "dispatch" ? (
            <div className="bg-[#fafbfc] border border-border rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#1d4ed8]" /> DISPATCH DETAILS
                </h4>
                {dispatchDateFilter && (
                  <span className="text-[11px] bg-blue-50 text-[#1d4ed8] border border-blue-200 px-2 py-0.5 rounded-md font-medium flex items-center gap-1.5">
                    Date Filter: {format(dispatchDateFilter, "dd MMM yyyy")}
                    <button
                      type="button"
                      onClick={handleClearDispatchDate}
                      className="text-blue-500 hover:text-blue-800 ml-0.5"
                      title="Clear date filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3.5">
                {/* 1. Dispatch Date Selection / Filter */}
                <div className="space-y-1.5 md:col-span-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Dispatch Date
                    </Label>
                    {dispatchDateFilter && (
                      <button
                        type="button"
                        onClick={handleClearDispatchDate}
                        className="text-[10px] text-[#1d4ed8] hover:underline flex items-center gap-0.5"
                        title="Clear date filter"
                      >
                        <X className="w-2.5 h-2.5" /> Clear
                      </button>
                    )}
                  </div>
                  <Popover open={dispatchDateOpen} onOpenChange={setDispatchDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-between h-9 text-xs bg-white border-border px-2.5 font-normal ${
                          dispatchDateFilter ? "text-slate-900 font-medium" : "text-muted-foreground"
                        }`}
                      >
                        <span className="truncate">
                          {dispatchDateFilter ? format(dispatchDateFilter, "dd MMM yyyy") : "Select Date..."}
                        </span>
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white shadow-xl border border-border" align="start">
                      <Calendar
                        mode="single"
                        selected={dispatchDateFilter || undefined}
                        onSelect={(d) => {
                          if (d) handleSelectDispatchDate(d);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 2. Shipment / Trip ID Selection */}
                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Shipment / Trip ID *
                  </Label>
                  <Popover open={shipmentDropdownOpen} onOpenChange={setShipmentDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-9 text-xs bg-white border-border px-2"
                      >
                        <span className="truncate">
                          {selectedShipment ? selectedShipment.shipmentId : "Select Shipment..."}
                        </span>
                        <Search className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[340px] p-2 bg-white shadow-xl border border-border" align="start">
                      <div className="space-y-2">
                        <Input
                          placeholder="Search shipment ID, vehicle, driver..."
                          value={shipmentSearch}
                          onChange={(e) => setShipmentSearch(e.target.value)}
                          className="h-8 text-xs"
                        />
                        {dispatchDateFilter && (
                          <div className="flex items-center justify-between px-2 py-1 bg-blue-50/80 rounded text-[11px] text-[#1d4ed8]">
                            <span>Filtered by: {format(dispatchDateFilter, "dd MMM yyyy")}</span>
                            <button
                              type="button"
                              onClick={handleClearDispatchDate}
                              className="text-[10px] font-semibold hover:underline"
                            >
                              Show All Dates
                            </button>
                          </div>
                        )}
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {filteredShipments.length === 0 ? (
                            <div className="p-3 text-center space-y-1">
                              <p className="text-xs text-muted-foreground">No shipments found</p>
                              {dispatchDateFilter && (
                                <button
                                  type="button"
                                  onClick={handleClearDispatchDate}
                                  className="text-[11px] text-[#1d4ed8] hover:underline"
                                >
                                  Clear date filter to see all shipments
                                </button>
                              )}
                            </div>
                          ) : (
                            filteredShipments.map((s) => {
                              const sDate = s.dispatchDate || s.createdAt;
                              return (
                                <button
                                  key={s.shipmentId}
                                  onClick={() => handleSelectShipment(s)}
                                  className="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-slate-100 transition-colors flex items-center justify-between"
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-foreground">{s.shipmentId}</span>
                                      {sDate && (
                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium border border-slate-200">
                                          {format(new Date(sDate), "dd MMM yyyy")}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {s.driverName || "No Driver"} • {s.vehicleNumber || s.vehicleId || "No Vehicle"}
                                    </p>
                                  </div>
                                  {selectedShipment?.shipmentId === s.shipmentId && (
                                    <Check className="w-3.5 h-3.5 text-[#1d4ed8] shrink-0" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 3. Vehicle No (Auto-filled) */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Vehicle No</Label>
                  <Input
                    readOnly
                    value={selectedShipment?.vehicleNumber || selectedShipment?.vehicleId || "—"}
                    className="h-9 bg-slate-100/80 border-border text-xs text-slate-700 font-medium"
                  />
                </div>

                {/* 4. Driver (Auto-filled) */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Driver</Label>
                  <Input
                    readOnly
                    value={selectedShipment?.driverName || "—"}
                    className="h-9 bg-slate-100/80 border-border text-xs text-slate-700 font-medium"
                  />
                </div>

                {/* 5. Weight (Auto-filled) */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Weight (KG)</Label>
                  <Input
                    readOnly
                    value={autoWeight ? `${autoWeight.toLocaleString()} kg` : "—"}
                    className="h-9 bg-slate-100/80 border-border text-xs text-slate-700 font-medium"
                  />
                </div>

                {/* 6. KM (Manual Input) */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">KM</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Enter KM"
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                    className="h-9 bg-white border-border text-xs text-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>
          ) : category === "maintenance" ? (
            <div className="bg-[#fafbfc] border border-border rounded-xl p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-600" /> MAINTENANCE DETAILS
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vehicle Selection */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Vehicle ID / Number *</Label>
                  <Select value={selectedVehicle} onValueChange={handleVehicleChange}>
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

                {/* Driver Input / Select */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Driver</Label>
                  <div className="relative">
                    <Input
                      placeholder="Driver name"
                      value={maintenanceDriver}
                      onChange={(e) => setMaintenanceDriver(e.target.value)}
                      className="h-9 bg-white border-border text-xs font-medium pr-24"
                    />
                    {driverList.length > 0 && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <Select
                          value={maintenanceDriver}
                          onValueChange={(val) => setMaintenanceDriver(val)}
                        >
                          <SelectTrigger className="h-7 text-[10px] bg-slate-50 border-border px-2 text-muted-foreground">
                            <SelectValue placeholder="Quick Pick" />
                          </SelectTrigger>
                          <SelectContent>
                            {driverList.map((d) => (
                              <SelectItem key={d} value={d} className="text-xs">
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#fafbfc] border border-border rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-600" /> MISCELLANEOUS DETAILS
              </h4>
              <p className="text-xs text-muted-foreground">
                Log general administrative, office, staff, or unassigned operational expenses below.
              </p>
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
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold">Date</Label>
                  {category === "dispatch" && selectedShipment && (
                    <span className="text-[10px] text-[#1d4ed8] font-medium flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> Synced to dispatch
                    </span>
                  )}
                </div>
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
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Saved Entries ({savedEntries.length})
              </h4>
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
            disabled={submitting}
            className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-semibold gap-2 h-9 px-5 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            {submitting
              ? "Saving..."
              : category === "dispatch"
              ? `Save Trip Expenses (${savedEntries.length})`
              : category === "maintenance"
              ? `Save Maintenance Expenses (${savedEntries.length})`
              : `Save Misc Expenses (${savedEntries.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddExpenseModal;
