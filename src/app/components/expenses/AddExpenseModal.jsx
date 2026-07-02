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
import { expenseTypes } from "./data/expensesData";

export function AddExpenseModal({
  open,
  onOpenChange,
  tripId, // passed if opened from a specific trip context
  lr, // fallback context if needed
  onSave,
  shipments = [],
}) {
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [shipmentSearch, setShipmentSearch] = useState("");
  const [shipmentDropdownOpen, setShipmentDropdownOpen] = useState(false);

  // Array of entries: each has { id, date, expenseType, amount, liters, notes, receiptUrl, uploading }
  const [entries, setEntries] = useState([]);
  const [openDatePopovers, setOpenDatePopovers] = useState({});

  // Reset modal on open
  useEffect(() => {
    if (open) {
      setShipmentSearch("");
      setOpenDatePopovers({});

      const targetTripId = tripId || (lr ? shipments.find(s => s.destinations?.some(d => d.lrNumber === lr))?.shipmentId : null);

      if (targetTripId) {
        const foundShipment = shipments.find((s) => s.shipmentId === targetTripId);
        if (foundShipment) {
          setSelectedShipment(foundShipment);
          setEntries([
            {
              id: 1,
              date: new Date(),
              expenseType: "",
              amount: "",
              liters: "",
              notes: "",
              receiptUrl: "",
              uploading: false,
            },
          ]);
        } else {
          setSelectedShipment(null);
          setEntries([
            {
              id: 1,
              date: new Date(),
              expenseType: "",
              amount: "",
              liters: "",
              notes: "",
              receiptUrl: "",
              uploading: false,
            },
          ]);
        }
      } else {
        setSelectedShipment(null);
        setEntries([
          {
            id: 1,
            date: new Date(),
            expenseType: "",
            amount: "",
            liters: "",
            notes: "",
            receiptUrl: "",
            uploading: false,
          },
        ]);
      }
    }
  }, [open, tripId, lr, shipments]);

  const filteredShipments = shipments.filter(
    (s) =>
      s.shipmentId?.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.driverName?.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.vehicleNumber?.toLowerCase().includes(shipmentSearch.toLowerCase())
  );

  const addEntry = () => {
    const nextId = entries.length > 0 ? Math.max(...entries.map((e) => e.id)) + 1 : 1;
    setEntries((prev) => [
      ...prev,
      {
        id: nextId,
        date: new Date(),
        expenseType: "",
        amount: "",
        liters: "",
        notes: "",
        receiptUrl: "",
        uploading: false,
      },
    ]);
  };

  const removeEntry = (id) => {
    if (entries.length === 1) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEntryField = (id, field, value) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const totalAmount = entries.reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0),
    0
  );

  const handleEntryFileUpload = async (entryId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(`"${file.name}" exceeds the 5MB limit.`);
      return;
    }

    try {
      updateEntryField(entryId, "uploading", true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          updateEntryField(entryId, "receiptUrl", ev.target.result);
        }
        updateEntryField(entryId, "uploading", false);
      };
      reader.onerror = () => {
        alert("Failed to read file");
        updateEntryField(entryId, "uploading", false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File processing error:", err);
      alert("Failed to process file");
      updateEntryField(entryId, "uploading", false);
    }
  };

  const handleSave = async () => {
    if (!selectedShipment) {
      alert("Please select a Trip / Shipment ID");
      return;
    }

    if (entries.some((entry) => !entry.expenseType || parseFloat(entry.amount) <= 0)) {
      alert("Please ensure all entries have a valid Expense Type and positive Amount.");
      return;
    }

    // Prepare payload in bulk form format: { tripId, entries: [...] }
    const payload = {
      tripId: selectedShipment.shipmentId,
      entries: entries.map((e) => ({
        lrNumber: selectedShipment?.destinations?.[0]?.lrNumber || "",
        date: format(e.date, "yyyy-MM-dd"),
        notes: e.notes || "",
        receiptUrl: e.receiptUrl || "",
        items: [
          {
            expenseType: e.expenseType,
            amount: parseFloat(e.amount) || 0,
            liters: e.expenseType === "Fuel" ? parseFloat(e.liters) || null : null,
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
      <DialogContent className="sm:max-w-[700px] p-0 max-h-[92vh] flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-base tracking-tight font-semibold">
            Add Trip-Based Expenses
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Group multiple expense entries across different dates and LR numbers under a single Trip.
          </DialogDescription>
        </DialogHeader>
        <Separator className="mt-4" />

        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* Trip Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              Select Trip / Shipment ID <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by Shipment ID, Vehicle, or Driver Name..."
                value={selectedShipment ? selectedShipment.shipmentId : shipmentSearch}
                onChange={(e) => {
                  setShipmentSearch(e.target.value);
                  setSelectedShipment(null);
                  setShipmentDropdownOpen(true);
                }}
                onFocus={() => {
                  if (!selectedShipment) setShipmentDropdownOpen(true);
                }}
                className="pl-9 h-10 bg-white border-border text-sm"
              />
              {selectedShipment && (
                <button
                  onClick={() => {
                    setSelectedShipment(null);
                    setShipmentSearch("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {shipmentDropdownOpen && !selectedShipment && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg max-h-[220px] overflow-y-auto">
                  {filteredShipments.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                      No matching trips found
                    </div>
                  ) : (
                    filteredShipments.map((s) => (
                      <button
                        key={s.shipmentId}
                        className="w-full text-left px-3.5 py-3 hover:bg-[#f0f4ff]/80 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0"
                        onClick={() => {
                          setSelectedShipment(s);
                          setShipmentSearch("");
                          setShipmentDropdownOpen(false);
                          // Initialize first entry
                          setEntries([
                            {
                              id: 1,
                              date: new Date(),
                              expenseType: "",
                              amount: "",
                              liters: "",
                              notes: "",
                              receiptUrl: "",
                              uploading: false,
                            },
                          ]);
                        }}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-xs text-[#1d4ed8]">
                            {s.shipmentId}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {s.destinations?.length || 0} destinations &middot;{" "}
                            {s.destinations?.map((d) => d.deliveryLocation).join(", ")}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 text-right">
                          <span className="text-xs font-medium text-foreground">
                            {s.vehicleNumber}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {s.driverName}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Show Shipment Summary Details if selected */}
          {selectedShipment && (
            <div className="grid grid-cols-2 gap-4 bg-[#f8f9fb] border border-border/80 rounded-lg p-3.5">
              <div>
                <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                  Driver Details
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {selectedShipment.driverName}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {selectedShipment.driverPhone || "---"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                  Vehicle Details
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {selectedShipment.vehicleNumber}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Capacity: {selectedShipment.vehicleCapacityKg || "---"} kg
                </span>
              </div>
            </div>
          )}

          <Separator className="my-2" />

          {/* Dynamic Expense Entries List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Expense Entries
              </Label>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-[#1d4ed8] text-[#1d4ed8] hover:bg-[#f0f4ff] hover:text-[#1e40af] gap-1 px-2.5"
                onClick={addEntry}
                disabled={!selectedShipment}
              >
                <Plus className="w-3.5 h-3.5" /> Add Expense Row
              </Button>
            </div>

            {!selectedShipment ? (
              <div className="text-center py-6 text-xs text-muted-foreground bg-slate-50/50 rounded-lg border border-dashed border-border">
                Please select a Trip above to start adding expense rows.
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="p-4 bg-white border border-slate-200/80 shadow-sm rounded-xl relative space-y-3.5 group hover:border-[#1d4ed8]/30 transition-all"
                  >
                    <div className="grid grid-cols-12 gap-3.5 items-end">
                      {/* Entry Date */}
                      <div className="col-span-5 space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                          Expense Date
                        </Label>
                        <Popover
                          open={openDatePopovers[entry.id] ?? false}
                          onOpenChange={(o) =>
                            setOpenDatePopovers((prev) => ({ ...prev, [entry.id]: o }))
                          }
                          modal={true}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start h-9 text-xs bg-white border-border gap-2"
                            >
                              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                              {entry.date ? format(entry.date, "dd MMM yyyy") : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={entry.date}
                              onSelect={(d) => {
                                updateEntryField(entry.id, "date", d || new Date());
                                setOpenDatePopovers((prev) => ({ ...prev, [entry.id]: false }));
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Expense Type */}
                      <div className="col-span-5 space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                          Type
                        </Label>
                        <Select
                          value={entry.expenseType}
                          onValueChange={(val) => {
                            updateEntryField(entry.id, "expenseType", val);
                            if (val !== "Fuel") {
                              updateEntryField(entry.id, "liters", "");
                            }
                          }}
                        >
                          <SelectTrigger className="h-9 bg-white border-border text-xs">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseTypes.filter(Boolean).map((t) => (
                              <SelectItem key={t} value={t} className="text-xs">
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Remove Button */}
                      <div className="col-span-2 text-right">
                        {entries.length > 1 && (
                          <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-muted-foreground hover:text-red-600 transition-colors"
                              onClick={() => removeEntry(entry.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-3.5 items-end">
                      {/* Amount */}
                      <div className="col-span-6 space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                          Amount (₹)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            ₹
                          </span>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            className="pl-6 h-9 bg-white border-border text-xs"
                            value={entry.amount}
                            onChange={(e) =>
                              updateEntryField(entry.id, "amount", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      {/* Liters (If fuel) */}
                      <div className="col-span-6 space-y-1.5">
                        {entry.expenseType === "Fuel" && (
                          <>
                            <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                              Liters
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0.0"
                              className="h-9 bg-white border-border text-xs"
                              value={entry.liters}
                              onChange={(e) =>
                                updateEntryField(entry.id, "liters", e.target.value)
                              }
                            />
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2.5">
                      {/* Entry Description / Notes */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase font-bold">Notes / Description</Label>
                        <Textarea
                          placeholder="Add details/notes for this specific expense entry..."
                          value={entry.notes || ""}
                          onChange={(e) => updateEntryField(entry.id, "notes", e.target.value)}
                          className="bg-white border-border resize-none h-[90px] text-xs"
                        />
                      </div>

                      {/* Upload Document / Receipt */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase font-bold">Upload Document / Receipt</Label>
                        <div
                          className="border border-dashed border-slate-300 rounded-lg p-3 text-center hover:border-[#1d4ed8]/30 hover:bg-[#f0f4ff]/30 transition-colors cursor-pointer relative h-[90px] flex flex-col justify-center"
                          onClick={() => document.getElementById(`receipt-upload-${entry.id}`).click()}
                        >
                          <input
                            id={`receipt-upload-${entry.id}`}
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleEntryFileUpload(entry.id, e)}
                          />
                          {entry.uploading ? (
                            <p className="text-xs text-muted-foreground">Uploading...</p>
                          ) : entry.receiptUrl ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <FileText className="w-4 h-4 text-[#1d4ed8] mx-auto" />
                              <p className="text-xs text-[#1d4ed8] font-medium">Receipt Uploaded</p>
                              <p className="text-[9px] text-muted-foreground truncate max-w-[180px]">
                                {entry.receiptUrl.split("/").pop()}
                              </p>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-muted-foreground mx-auto mb-0.5" />
                              <p className="text-xs text-muted-foreground">
                                Drag & drop or{" "}
                                <span className="text-[#1d4ed8] hover:underline">browse</span>
                              </p>
                              <p className="text-[9px] text-muted-foreground/60">PDF, PNG, JPG (5MB)</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-2" />

          {/* Sum Total Indicator */}
          <div className="flex items-center justify-between bg-[#f0f4ff] border border-[#1d4ed8]/20 rounded-lg px-4 py-3">
            <span className="text-xs font-semibold text-[#1d4ed8] uppercase tracking-wide">
              Total Trip Expense Amount
            </span>
            <span className="text-sm font-bold text-[#1d4ed8] tabular-nums">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <Separator />
        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs gap-2 shadow-sm px-4"
          >
            <Plus className="w-3.5 h-3.5" />
            Save Trip Expenses ({entries.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default AddExpenseModal;
