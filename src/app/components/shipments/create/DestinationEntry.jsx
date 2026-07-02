import { useEffect, useState, useRef } from "react";
import { Building2, Package, Hash, Weight, Layers, FileText, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { format } from "date-fns";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

export function DestinationEntry({
  entry,
  index,
  canRemove,
  onRemove,
  onUpdate,
  lrNumber,
  usedPlantNumbers = [], // plant numbers already selected in other entries
  onAddRelatedPlant,
  onRemoveRelatedPlant,
  isEditMode = false,
  initialInvoices = [], // array of populated invoice objects
}) {
  const activePlants = [entry.plantReferenceNumber, ...(entry.additionalPlants || [])].filter(Boolean);
  const [plantNumbers, setPlantNumbers] = useState([]);
  const [invoices, setInvoices]         = useState([]);
  const [relatedPlants, setRelatedPlants] = useState([]);
  const [loadingPlants, setLoadingPlants]   = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const prevPlantsRef = useRef([]);

  // Fetch plant numbers on mount
  useEffect(() => {
    setLoadingPlants(true);
    fetch(`${API_BASE_URL}/shipments/plant-numbers`, { credentials: "include" })
      .then((r) => r.json())
      .then((res) => setPlantNumbers(res.success ? res.data : []))
      .catch(() => setPlantNumbers([]))
      .finally(() => setLoadingPlants(false));
  }, []);

  // Fetch invoices when plant or additional plants change — also auto-fill customerName + location
  useEffect(() => {
    const currentPlants = [entry.plantReferenceNumber, ...(entry.additionalPlants || [])].filter(Boolean);
    if (currentPlants.length === 0) {
      setInvoices([]);
      prevPlantsRef.current = [];
      return;
    }

    setLoadingInvoices(true);

    Promise.all(
      currentPlants.map((plant) =>
        fetch(`${API_BASE_URL}/shipments/invoices-by-plant/${encodeURIComponent(plant)}`, { credentials: "include" })
          .then((r) => r.json())
          .then((res) => (res.success ? res.data : []))
          .catch(() => [])
      )
    )
      .then((results) => {
        const combined = results.flat();

        // Sort by invoiceDate descending
        combined.sort((a, b) => {
          const dA = a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0;
          const dB = b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0;
          return dB - dA;
        });

        setInvoices(combined);

        // Auto-fill customerName and deliveryLocation from first invoice
        if (combined.length > 0) {
          const first = combined[0];
          if (!entry.customerName && first.customerName) {
            onUpdate(entry.id, "customerName", first.customerName);
          }
          if (!entry.deliveryLocation && first.location) {
            onUpdate(entry.id, "deliveryLocation", first.location);
          }
        }
      })
      .catch(() => setInvoices([]))
      .finally(() => setLoadingInvoices(false));
  }, [entry.plantReferenceNumber, entry.additionalPlants]);

  // Automatically synchronize invoiceIds with the active plants' invoices
  useEffect(() => {
    const currentPlants = [entry.plantReferenceNumber, ...(entry.additionalPlants || [])].filter(Boolean);
    if (currentPlants.length === 0) {
      if (entry.invoiceIds?.length > 0) {
        onUpdate(entry.id, "invoiceIds", []);
      }
      return;
    }

    // Combine originally assigned invoices with newly fetched pending invoices
    // Filter out duplicates by _id
    const combinedInvoicesMap = new Map();
    [...(initialInvoices || []), ...invoices].forEach((inv) => {
      if (inv && inv._id) {
        combinedInvoicesMap.set(inv._id.toString(), inv);
      }
    });

    const combinedInvoices = Array.from(combinedInvoicesMap.values());

    // Filter to only keep invoices belonging to active plants
    const activeInvoices = combinedInvoices.filter(
      (inv) => inv.plantReferenceNumber && currentPlants.includes(inv.plantReferenceNumber.toString())
    );

    const activeIds = activeInvoices.map((inv) => inv._id.toString());
    const currentSelected = (entry.invoiceIds || []).map((id) => id.toString());

    // Check if they are different
    const different =
      activeIds.length !== currentSelected.length ||
      !activeIds.every((id) => currentSelected.includes(id));

    if (different) {
      onUpdate(entry.id, "invoiceIds", activeIds);
    }
  }, [entry.plantReferenceNumber, entry.additionalPlants, invoices, initialInvoices, entry.invoiceIds]);

  // Fetch related plants when primary plant changes
  useEffect(() => {
    if (!entry.plantReferenceNumber) { setRelatedPlants([]); return; }
    fetch(`${API_BASE_URL}/shipments/related-plants/${encodeURIComponent(entry.plantReferenceNumber)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((res) => setRelatedPlants(res.success ? res.data : []))
      .catch(() => setRelatedPlants([]));
  }, [entry.plantReferenceNumber]);

  return (
    <div className="p-5 border border-border rounded-xl bg-[#fafbfc] space-y-6 relative shadow-sm">
      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(entry.id)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}

      {/* Destination badge + LR number preview */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="bg-[#f0f4ff] text-[#1d4ed8] border-[#c7d7fe] px-2.5 py-0.5">
          Destination {index + 1}
        </Badge>
        <div className="flex items-center gap-1.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-3 py-1">
          <FileText className="w-3 h-3 text-[#16a34a]" />
          <span className="text-[10px] text-[#15803d] uppercase tracking-wider">LR No.</span>
          <span className="text-xs text-[#166534] tracking-tight">
            {lrNumber || `LR-${new Date().getFullYear()}-XXXXX-${String(index + 1).padStart(2, "0")}`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Plant + Invoices */}
        <div className="space-y-4">
          {/* Plant Number */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Plant Number
            </Label>
            <Select
              value={entry.plantReferenceNumber || ""}
              onValueChange={(val) => {
                onUpdate(entry.id, "plantReferenceNumber", val);
                onUpdate(entry.id, "invoiceIds", []);
              }}
              disabled={loadingPlants}
            >
              <SelectTrigger className="w-full bg-white border-border h-11">
                <SelectValue placeholder={loadingPlants ? "Loading..." : "Select plant..."} />
              </SelectTrigger>
              <SelectContent>
                {plantNumbers.filter(Boolean).map((plant) => {
                  const isUsed = usedPlantNumbers.includes(plant);
                  return (
                    <SelectItem
                      key={plant}
                      value={plant}
                      disabled={isUsed}
                      className={isUsed ? "opacity-40 cursor-not-allowed" : ""}
                    >
                      <span className="flex items-center justify-between w-full gap-3">
                        {plant}
                        {isUsed && (
                          <span className="text-[10px] text-muted-foreground ml-2">Already selected</span>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Related Plants */}
          {entry.plantReferenceNumber && relatedPlants.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <Label className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                🔗 Related Plants (same customer/location)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {relatedPlants.map((plant) => {
                  const isPrimary = entry.plantReferenceNumber === plant;
                  const isAdditional = (entry.additionalPlants || []).includes(plant);
                  const isUsedElsewhere = usedPlantNumbers.includes(plant) && !isAdditional && !isPrimary;

                  return (
                    <Badge
                      key={plant}
                      variant="outline"
                      className={`px-2 py-0.5 text-xs flex items-center gap-1.5 transition-colors border select-none ${
                        isPrimary || isAdditional
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium cursor-pointer"
                          : isUsedElsewhere
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (isUsedElsewhere) return;
                        if (isPrimary) return;
                        if (isAdditional) {
                          onRemoveRelatedPlant?.(plant);
                        } else {
                          onAddRelatedPlant?.(plant);
                        }
                      }}
                    >
                      <span>{plant}</span>
                      {!isPrimary && !isUsedElsewhere && (
                        <span className={`text-[9px] font-bold ${isAdditional ? "text-indigo-400 hover:text-red-500" : "text-emerald-500"}`}>
                          {isAdditional ? "✕ Remove" : "+ Add"}
                        </span>
                      )}
                      {isUsedElsewhere && (
                        <span className="text-[9px] text-slate-400">(Selected elsewhere)</span>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Plants & Invoices */}
          {entry.plantReferenceNumber && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-[#1d4ed8]" /> Selected Plants & Invoices
              </Label>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {loadingInvoices ? (
                  <div className="bg-white border border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground py-2">Loading plant details & invoices...</p>
                  </div>
                ) : activePlants.length === 0 ? (
                  <div className="bg-white border border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground py-2">No plants selected</p>
                  </div>
                ) : (
                  activePlants.map((plant) => {
                    const plantInvoices = [...(initialInvoices || []), ...invoices].filter(
                      (inv) => inv && inv.plantReferenceNumber && inv.plantReferenceNumber.toString() === plant.toString()
                    );
                    
                    // Filter duplicates by _id
                    const uniqueInvoicesMap = new Map();
                    plantInvoices.forEach((inv) => {
                      if (inv && inv._id) {
                        uniqueInvoicesMap.set(inv._id.toString(), inv);
                      }
                    });
                    const uniqueInvoices = Array.from(uniqueInvoicesMap.values());
                    
                    const firstInv = uniqueInvoices[0];
                    const location = firstInv?.location || "";
                    const customerName = firstInv?.customerName || "";

                    return (
                      <div
                        key={plant}
                        className="bg-white border border-[#c7d7fe] hover:border-[#a3b8cc] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#1d4ed8] tracking-tight flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-[#1d4ed8]" /> Plant: {plant}
                            </span>
                            <Badge className="bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] text-[9px] font-medium px-2 py-0.5 rounded-full">
                              Included
                            </Badge>
                          </div>
                          {customerName && (
                            <p className="text-xs text-slate-700 font-medium">{customerName}</p>
                          )}
                          {location && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              📍 {location}
                            </p>
                          )}
                        </div>

                        <div className="sm:text-right space-y-1 shrink-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            Associated Invoices ({uniqueInvoices.length})
                          </p>
                          {uniqueInvoices.length === 0 ? (
                            <p className="text-xs text-amber-500 font-medium">No pending invoices</p>
                          ) : (
                            <div className="flex flex-wrap gap-1 sm:justify-end max-w-xs">
                              {uniqueInvoices.map((inv) => (
                                <Badge
                                  key={inv._id}
                                  variant="outline"
                                  className="text-[10px] px-2 py-0.5 border-slate-200 bg-slate-50 text-slate-700 font-semibold"
                                >
                                  {inv.invoiceNumber}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {!loadingInvoices && invoices.length > 0 && (
                <p className="text-[11px] text-[#16a34a] font-medium flex items-center gap-1">
                  ✓ {invoices.length} invoice{invoices.length > 1 ? "s" : ""} from {activePlants.length} plant{activePlants.length > 1 ? "s" : ""} automatically included under this destination
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: Quantities & Weight */}
        <div className="space-y-4">
          <h4 className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Package className="w-3.5 h-3.5" /> Item Quantities & Weight
          </h4>

          {[
            { field: "totalTyres", label: "Total Tyres" },
            { field: "totalTubes", label: "Total Tubes" },
            { field: "totalFlaps", label: "Total Flaps" },
          ].map(({ field, label }) => (
            <div key={field} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Hash className="w-3 h-3" /> {label}
              </Label>
              <Input
                type="number"
                min={0}
                value={entry[field] || ""}
                onChange={(e) => onUpdate(entry.id, field, parseInt(e.target.value) || 0)}
                placeholder="0"
                className="bg-white border-border h-11"
              />
            </div>
          ))}

          {/* Auto total */}
          <div className="bg-[#eef2ff] border border-[#c7d7fe] rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#4338ca]" />
              <span className="text-xs text-[#4338ca]">Total Quantity</span>
            </div>
            <span className="text-sm text-[#1d4ed8] tracking-tight">
              {(entry.totalTyres || 0) + (entry.totalTubes || 0) + (entry.totalFlaps || 0)} pcs
            </span>
          </div>

          {/* Weight */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Weight className="w-3 h-3" /> Weight (kg)
            </Label>
            <Input
              type="number"
              min={0}
              step="0.5"
              value={entry.weightKg || ""}
              onChange={(e) => onUpdate(entry.id, "weightKg", e.target.value)}
              placeholder="Enter weight in kg"
              className="bg-white border-border h-11"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DestinationEntry;
