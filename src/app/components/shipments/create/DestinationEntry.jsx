import { useEffect, useState, useRef } from "react";
import { Building2, Package, Hash, Weight, Layers, FileText, Trash2, Users, Save, MousePointerClick } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../../ui/tooltip";
import { format } from "date-fns";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

const arraysEqual = (a, b) => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
};

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
  const activePlants = [...(entry.additionalPlants || []), entry.plantReferenceNumber].filter(Boolean);
  const [plantNumbers, setPlantNumbers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [relatedPlants, setRelatedPlants] = useState([]);
  const [loadingPlants, setLoadingPlants] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const prevPlantsRef = useRef(
    [entry.plantReferenceNumber, ...(entry.additionalPlants || [])].filter(Boolean)
  );

  // ── Per-plant editor state ──────────────────────────────────────────────────
  const [selectedPlant, setSelectedPlant] = useState(null); // which plant card is active in the editor
  const [editData, setEditData] = useState({ totalTyres: "", totalTubes: "", totalFlaps: "", weightKg: "" });
  const [savedPlants, setSavedPlants] = useState(new Set()); // tracks which plants have been saved once

  // Fetch plant numbers on mount
  useEffect(() => {
    setLoadingPlants(true);
    fetch(`${API_BASE_URL}/shipments/plant-numbers`, { credentials: "include" })
      .then((r) => r.json())
      .then((res) => setPlantNumbers(res.success ? res.data : []))
      .catch(() => setPlantNumbers([]))
      .finally(() => setLoadingPlants(false));
  }, []);



  // Fetch invoices when plant or additional plants change — build per-plant data in entry.plantData
  useEffect(() => {
    const currentPlants = [entry.plantReferenceNumber, ...(entry.additionalPlants || [])].filter(Boolean);
    if (currentPlants.length === 0) {
      setInvoices([]);
      prevPlantsRef.current = [];
      onUpdate(entry.id, "plantData", {});
      return;
    }

    setLoadingInvoices(true);

    const includeIds = (entry.invoiceIds || []).map(id => typeof id === "object" ? id._id : id).filter(Boolean).join(",");
    const queryParam = includeIds ? `?includeInvoiceIds=${encodeURIComponent(includeIds)}` : "";

    Promise.all(
      currentPlants.map((plant) =>
        fetch(`${API_BASE_URL}/shipments/invoices-by-plant/${encodeURIComponent(plant)}${queryParam}`, { credentials: "include" })
          .then((r) => r.json())
          .then((res) => ({ plant, invoices: res.success ? res.data : [] }))
          .catch(() => ({ plant, invoices: [] }))
      )
    )
      .then((perPlantResults) => {
        const combined = perPlantResults.flatMap((r) => r.invoices);

        // Sort by invoiceDate descending
        combined.sort((a, b) => {
          const dA = a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0;
          const dB = b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0;
          return dB - dA;
        });

        // Combine with initialInvoices
        const combinedInvoicesMap = new Map();
        [...(initialInvoices || []), ...combined].forEach((inv) => {
          if (inv && inv._id) combinedInvoicesMap.set(inv._id.toString(), inv);
        });

        setInvoices(combined);
        prevPlantsRef.current = currentPlants;

        // Auto-fill customerName / deliveryLocation
        const allActive = Array.from(combinedInvoicesMap.values()).filter(
          (inv) => inv.plantReferenceNumber && currentPlants.includes(inv.plantReferenceNumber.toString())
        );
        if (allActive.length > 0) {
          const first = allActive[0];
          if (!entry.customerName && first.customerName) onUpdate(entry.id, "customerName", first.customerName);
          if (!entry.deliveryLocation && first.location) onUpdate(entry.id, "deliveryLocation", first.location);
        }

        // Build per-plant data from invoice totals (only seed if user hasn't already saved custom values)
        const existingPlantData = entry.plantData || {};
        const newPlantData = { ...existingPlantData };
        let changed = false;
        for (const { plant } of perPlantResults) {
          // If the user already saved custom data for this plant, don't overwrite
          if (savedPlants.has(plant) && existingPlantData[plant]) continue;
          const plantInvs = Array.from(combinedInvoicesMap.values()).filter(
            (inv) => inv.plantReferenceNumber && inv.plantReferenceNumber.toString() === plant
          );
          const autoData = {
            totalTyres:  plantInvs.reduce((s, inv) => s + (Number(inv.tyre)   || 0), 0),
            totalTubes:  plantInvs.reduce((s, inv) => s + (Number(inv.tube)   || 0), 0),
            totalFlaps:  plantInvs.reduce((s, inv) => s + (Number(inv.flap)   || 0), 0),
            weightKg:    plantInvs.reduce((s, inv) => s + (Number(inv.weight) || 0), 0).toFixed(2),
          };
          if (JSON.stringify(existingPlantData[plant]) !== JSON.stringify(autoData)) {
            newPlantData[plant] = autoData;
            changed = true;
          }
        }
        // Remove stale plants that are no longer selected
        for (const key of Object.keys(newPlantData)) {
          if (!currentPlants.includes(key)) { delete newPlantData[key]; changed = true; }
        }
        if (changed) onUpdate(entry.id, "plantData", newPlantData);
      })
      .catch(() => setInvoices([]))
      .finally(() => setLoadingInvoices(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.plantReferenceNumber, entry.additionalPlants, entry.invoiceIds]);

  // When a plant card is clicked: load its current data into the editor
  const handleSelectPlant = (plant) => {
    setSelectedPlant(plant);
    const pd = (entry.plantData || {})[plant] || {};
    setEditData({
      totalTyres: pd.totalTyres ?? "",
      totalTubes: pd.totalTubes ?? "",
      totalFlaps: pd.totalFlaps ?? "",
      weightKg:   pd.weightKg   ?? "",
    });
  };

  // Save the edited values back to entry.plantData for the selected plant
  const handleSavePlantData = () => {
    if (!selectedPlant) return;
    const updated = {
      ...(entry.plantData || {}),
      [selectedPlant]: {
        totalTyres: parseInt(editData.totalTyres) || 0,
        totalTubes: parseInt(editData.totalTubes) || 0,
        totalFlaps: parseInt(editData.totalFlaps) || 0,
        weightKg:   editData.weightKg || "0.00",
      },
    };
    onUpdate(entry.id, "plantData", updated);
    setSavedPlants((prev) => new Set(prev).add(selectedPlant));
    setSelectedPlant(null); // deselect after saving
  };

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

    const activeInvoices = combinedInvoices.filter(
      (inv) =>
        inv.plantReferenceNumber && currentPlants.includes(inv.plantReferenceNumber.toString())
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
          {/* Customer Name Select */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Customer Name *
            </Label>
            <Select
              value={entry.plantReferenceNumber || ""}
              onValueChange={(val) => {
                const pObj = plantNumbers.find(p => p.plantNumber === val);
                onUpdate(entry.id, "plantReferenceNumber", val);
                onUpdate(entry.id, "customerName", pObj ? pObj.customerName : "");
                onUpdate(entry.id, "invoiceIds", []);
              }}
              disabled={loadingPlants}
            >
              <SelectTrigger className="w-full bg-white border-border h-11">
                <SelectValue placeholder={loadingPlants ? "Loading..." : "Select customer..."} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {plantNumbers.map((pObj) => {
                  const plant = pObj.plantNumber;
                  const customer = pObj.customerName;
                  const isUsed = usedPlantNumbers.includes(plant);
                  return (
                    <SelectItem
                      key={plant}
                      value={plant}
                      disabled={isUsed}
                      className={isUsed ? "opacity-40 cursor-not-allowed" : ""}
                    >
                      <span className="flex items-center justify-between w-full gap-3">
                        <span>{customer} - <span className="text-slate-400 font-normal text-xs">{plant}</span></span>
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
                      className={`px-2 py-0.5 text-xs flex items-center gap-1.5 transition-colors border select-none ${isPrimary || isAdditional
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium cursor-pointer"
                        : isUsedElsewhere
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 cursor-pointer"
                        }`}
                      onClick={() => {
                        if (isUsedElsewhere) return;
                        if (isPrimary || isAdditional) {
                          onRemoveRelatedPlant?.(plant);
                        } else {
                          onAddRelatedPlant?.(plant);
                        }
                      }}
                    >
                      <span>{plant}</span>
                      {(isPrimary || isAdditional) && (
                        <span className="text-[9px] font-bold text-indigo-400 hover:text-red-500">
                          ✕ Remove
                        </span>
                      )}
                      {!isPrimary && !isAdditional && !isUsedElsewhere && (
                        <span className="text-[9px] font-bold text-emerald-500">
                          + Add
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

                    const isSelected = selectedPlant === plant;
                    const pd = (entry.plantData || {})[plant];

                    return (
                      <div
                        key={plant}
                        className={`bg-white rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all border-2 ${
                          isSelected
                            ? "border-indigo-400 ring-2 ring-indigo-100"
                            : "border-[#c7d7fe] hover:border-[#a3b8cc]"
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[#1d4ed8] tracking-tight flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-[#1d4ed8]" /> {customerName || "Loading..."}
                            </span>
                            {/* Edit Qty button */}
                            <button
                              type="button"
                              title="Edit quantities & weight for this plant"
                              onClick={() => handleSelectPlant(plant)}
                              className={`text-[10px] font-bold border rounded px-1.5 py-0.5 transition-colors leading-none flex items-center gap-0.5 ${
                                isSelected
                                  ? "text-indigo-600 border-indigo-300 bg-indigo-50"
                                  : "text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                              }`}
                            >
                              ✏ Edit Qty
                            </button>
                            {/* Remove button */}
                            <button
                              type="button"
                              title="Remove this plant"
                              onClick={() => onRemoveRelatedPlant?.(plant)}
                              className="ml-auto text-[10px] font-bold text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-200 rounded px-1.5 py-0.5 transition-colors leading-none flex items-center gap-0.5"
                            >
                              ✕ Remove
                            </button>
                          </div>
                          <p className="text-xs text-slate-700 font-medium">Plant: {plant}</p>
                          {location && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              📍 {location}
                            </p>
                          )}
                          {/* Saved per-plant data summary */}
                          {pd && (
                            <p className="text-[10px] text-emerald-600 font-semibold flex gap-2 flex-wrap pt-0.5">
                              <span>🚗 {pd.totalTyres||0}</span>
                              <span>🍩 {pd.totalTubes||0}</span>
                              <span>🎗️ {pd.totalFlaps||0}</span>
                              <span>⚖️ {pd.weightKg||0} kg</span>
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
            </div>
          )}
        </div>

        {/* Right: Per-plant Quantities & Weight editor */}
        <div className="space-y-4">
          {selectedPlant ? (
            /* ── EDIT MODE: editing a specific plant ── */
            <>
              <div className="flex items-center justify-between">
                <h4 className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Plant Data
                  <span className="ml-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5">
                    {selectedPlant}
                  </span>
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSavePlantData}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-2.5 py-1.5 transition-colors leading-none flex items-center gap-1"
                  >
                    <Save className="w-3 h-3 text-emerald-700" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlant(null)}
                    className="text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors border border-slate-200 rounded-lg px-2.5 py-1.5 leading-none"
                  >
                    ✕ cancel
                  </button>
                </div>
              </div>

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
                    value={editData[field] ?? ""}
                    onChange={(ev) => setEditData((p) => ({ ...p, [field]: ev.target.value }))}
                    placeholder="0"
                    className="bg-white border-indigo-300 ring-1 ring-indigo-200 h-11"
                  />
                </div>
              ))}

              {/* Total */}
              <div className="bg-[#eef2ff] border border-[#c7d7fe] rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#4338ca]" />
                  <span className="text-xs text-[#4338ca]">Subtotal</span>
                </div>
                <span className="text-sm text-[#1d4ed8] tracking-tight">
                  {(parseInt(editData.totalTyres) || 0) + (parseInt(editData.totalTubes) || 0) + (parseInt(editData.totalFlaps) || 0)} pcs
                </span>
              </div>

              {/* Weight for this plant */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Weight className="w-3 h-3" /> Weight (kg)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={editData.weightKg ?? ""}
                  onChange={(ev) => setEditData((p) => ({ ...p, weightKg: ev.target.value }))}
                  placeholder="Enter weight in kg"
                  className="bg-white border-indigo-300 ring-1 ring-indigo-200 h-11"
                />
              </div>

            </>
          ) : (
            /* ── SUMMARY MODE: no plant selected ── */
            <>
              <h4 className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Package className="w-3.5 h-3.5" /> Item Quantities & Weight
              </h4>

              {/* Prompt to click a plant */}
              {activePlants.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] text-indigo-500 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                  <MousePointerClick className="w-3.5 h-3.5 shrink-0" />
                  Click a plant card on the left to edit its quantities & weight individually.
                </div>
              )}




              {/* Combined totals (read-only sum from plantData) */}
              {(() => {
                const pd = entry.plantData || {};
                const vals = Object.values(pd);
                const tyres  = vals.reduce((s, v) => s + (v.totalTyres  || 0), 0);
                const tubes  = vals.reduce((s, v) => s + (v.totalTubes  || 0), 0);
                const flaps  = vals.reduce((s, v) => s + (v.totalFlaps  || 0), 0);
                const weight = vals.reduce((s, v) => s + (parseFloat(v.weightKg) || 0), 0);
                return (
                  <div className="bg-[#eef2ff] border border-[#c7d7fe] rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#4338ca]" />
                        <span className="text-xs text-[#4338ca]">Combined Total</span>
                      </div>
                      <span className="text-sm text-[#1d4ed8] tracking-tight">{tyres + tubes + flaps} pcs</span>
                    </div>
                    <div className="text-[11px] text-indigo-700 font-semibold flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>🚗 Tyres: {tyres}</span>
                      <span>🍩 Tubes: {tubes}</span>
                      <span>🎗️ Flaps: {flaps}</span>
                      <span className="ml-auto text-[#1d4ed8]">⚖️ {weight.toFixed(2)} kg</span>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DestinationEntry;
