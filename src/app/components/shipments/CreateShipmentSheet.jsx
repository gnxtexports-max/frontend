import { useState, useEffect } from "react";
import { MapPin, Truck, Plus, CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "../ui/sheet";
import { SectionHeader } from "./ui/ShipmentUIComponents";
import { DestinationEntry } from "./create/DestinationEntry";
import { VehicleDriverSection } from "./create/VehicleDriverSection";
import { ShipmentSummaryCard } from "./create/ShipmentSummaryCard";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";
const DRAFT_KEY = "shipment_draft";

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const emptyEntry = () => ({
  id: generateId(),
  plantReferenceNumber: "",
  additionalPlants: [],
  invoiceIds: [],
  totalTyres: 0,
  totalTubes: 0,
  totalFlaps: 0,
  weightKg: "",
});

function saveDraft(dealerEntries, vehicleId, driverId) {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ dealerEntries, vehicleId, driverId, savedAt: new Date().toISOString() })
    );
  } catch (_) { }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch (_) { }
}

export function CreateShipmentSheet({ open, onOpenChange, onCreated, editShipment }) {
  const [dealerEntries, setDealerEntries] = useState([emptyEntry()]);
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [driverId, setDriverId] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loadingV, setLoadingV] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdShipment, setCreatedShipment] = useState(null);
  const [nextIds, setNextIds] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const isEditMode = !!editShipment;

  useEffect(() => {
    if (!open) return;

    // Fetch vehicles
    setLoadingV(true);
    fetch(`${API_BASE_URL}/vehicles`, { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setVehicles(list);
      })
      .catch(() => setVehicles([]))
      .finally(() => setLoadingV(false));

    if (editShipment) {
      const entries = (editShipment.destinations ?? []).map((dest) => {
        const parts = (dest.plantReferenceNumber || "").split(",").map((p) => p.trim()).filter(Boolean);
        const primary = parts[0] || "";
        const additional = parts.slice(1);
        return {
          id: generateId(),
          plantReferenceNumber: primary,
          additionalPlants: additional,
          invoiceIds: (dest.invoiceIds ?? []).map((inv) => (typeof inv === "object" ? inv._id : inv)),
          deliveryLocation: dest.deliveryLocation || "",
          totalTyres: dest.totalTyres || 0,
          totalTubes: dest.totalTubes || 0,
          totalFlaps: dest.totalFlaps || 0,
          weightKg: dest.weightKg || "",
        };
      });
      setDealerEntries(entries.length ? entries : [emptyEntry()]);
      setVehicleId(typeof editShipment.vehicleId === "object" ? editShipment.vehicleId._id : editShipment.vehicleId || "");
      setDriverId(typeof editShipment.driverId === "object" ? editShipment.driverId._id : editShipment.driverId || "");
    } else {
      // Restore draft in create mode
      const draft = loadDraft();
      if (draft?.dealerEntries?.length) {
        setDealerEntries(draft.dealerEntries);
        setVehicleId(draft.vehicleId || "");
        setDriverId(draft.driverId || "");
        setHasDraft(true);
      }
      fetch(`${API_BASE_URL}/shipments/next-id`, { credentials: "include" })
        .then((r) => r.json())
        .then((res) => { if (res.success) setNextIds(res.data); })
        .catch(() => { });
    }
  }, [open, editShipment]);

  const totalTyresAll = dealerEntries.reduce((s, e) => s + (e.totalTyres || 0), 0);
  const totalTubesAll = dealerEntries.reduce((s, e) => s + (e.totalTubes || 0), 0);
  const totalFlapsAll = dealerEntries.reduce((s, e) => s + (e.totalFlaps || 0), 0);
  const totalQuantity = totalTyresAll + totalTubesAll + totalFlapsAll;
  const totalWeight = dealerEntries.reduce((s, e) => s + (parseFloat(e.weightKg) || 0), 0);

  const addEntry = () => setDealerEntries((p) => [...p, emptyEntry()]);
  const removeEntry = (id) => setDealerEntries((p) => p.filter((e) => e.id !== id));
  const updateEntry = (id, field, value) =>
    setDealerEntries((p) => p.map((e) => (e.id === id ? { ...e, [field]: value } : e)));

  const addRelatedPlant = (entryId, plantRef) => {
    setDealerEntries((p) =>
      p.map((e) => {
        if (e.id === entryId) {
          const additional = e.additionalPlants || [];
          if (!additional.includes(plantRef)) {
            return {
              ...e,
              additionalPlants: [...additional, plantRef],
            };
          }
        }
        return e;
      })
    );
  };

  const removeRelatedPlant = (entryId, plantRef) => {
    setDealerEntries((p) =>
      p.map((e) => {
        if (e.id === entryId) {
          const additional = e.additionalPlants || [];
          return {
            ...e,
            additionalPlants: additional.filter((pr) => pr !== plantRef),
          };
        }
        return e;
      })
    );
  };

  const resetForm = () => {
    setDealerEntries([emptyEntry()]);
    setVehicleId(""); setVehicleOpen(false);
    setDriverId(""); setError(""); setCreatedShipment(null);
    setNextIds(null); setDraftSaved(false); setHasDraft(false);
  };

  const handleSaveDraft = () => {
    saveDraft(dealerEntries, vehicleId, driverId);
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2500);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setDealerEntries([emptyEntry()]);
    setVehicleId(""); setDriverId("");
    setHasDraft(false);
  };

  const handleCreate = async () => {
    setError("");
    for (const [i, e] of dealerEntries.entries()) {
      if (!e.plantReferenceNumber) {
        setError(`Destination ${i + 1}: Please select a plant number`);
        return;
      }
    }
    const plants = dealerEntries.map((e) => [e.plantReferenceNumber, ...(e.additionalPlants || [])]).flat().filter(Boolean);
    const duplicates = plants.filter((p, i) => plants.indexOf(p) !== i);
    if (duplicates.length > 0) {
      setError(`Duplicate plant: ${[...new Set(duplicates)].join(", ")} — each destination must use a different plant`);
      return;
    }
    if (!vehicleId) { setError("Please select a vehicle"); return; }
    if (!driverId) { setError("Please select a driver"); return; }

    const selectedVehicle = vehicles.find((v) => v._id === vehicleId);
    if (selectedVehicle) {
      const vehicleCapacity = selectedVehicle.capacityKg || selectedVehicle.capacity || 0;
      if (vehicleCapacity > 0 && totalWeight > vehicleCapacity) {
        const proceed = window.confirm(
          `Warning: Total weight of the shipment (${totalWeight} kg) exceeds the vehicle capacity (${vehicleCapacity} kg).\n\nDo you want to proceed?`
        );
        if (!proceed) return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        destinations: dealerEntries.map((e) => ({
          plantReferenceNumber: [e.plantReferenceNumber, ...(e.additionalPlants || [])].filter(Boolean).join(", "),
          invoiceIds: e.invoiceIds || [],
          deliveryLocation: e.deliveryLocation || "",
          totalTyres: e.totalTyres || 0,
          totalTubes: e.totalTubes || 0,
          totalFlaps: e.totalFlaps || 0,
          weightKg: parseFloat(e.weightKg) || 0,
        })),
        vehicleId,
        driverId,
      };

      const url = isEditMode ? `${API_BASE_URL}/shipments/${editShipment._id}` : `${API_BASE_URL}/shipments`;
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || `Failed to ${isEditMode ? "update" : "create"} shipment`);

      if (!isEditMode) clearDraft(); // clear draft on successful create

      setCreatedShipment(result.data);
      if (onCreated) onCreated(result.data);
      setTimeout(() => { resetForm(); onOpenChange(false); }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(val) => { if (!val) resetForm(); onOpenChange(val); }}>
      <SheetContent side="right" className="sm:max-w-none w-full sm:w-[78%] p-0 gap-0 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-white shrink-0">
          <div>
            <SheetTitle className="text-lg tracking-tight">
              {isEditMode ? "Edit Shipment" : "Create Shipment"}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground mt-0.5">
              {isEditMode ? "Update the shipment details below" : "Fill in the details to dispatch a new tyre shipment"}
            </SheetDescription>
          </div>
          <div className="bg-[#f0f4ff] border border-[#c7d7fe] rounded-lg px-3 py-1.5">
            <p className="text-[10px] text-[#4b6cb7] tracking-wide uppercase">Shipment ID</p>
            <p className="text-sm text-[#1d4ed8] tracking-tight">
              {isEditMode
                ? editShipment.shipmentId
                : (createdShipment?.shipmentId ?? nextIds?.nextShipmentId ?? `SHP-${new Date().getFullYear()}-…`)}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-5xl mx-auto px-8 py-6 space-y-0">

            {/* Draft restored banner */}
            {hasDraft && !isEditMode && (
              <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center justify-between gap-3">
                <span>📋 Draft restored — your previous unsaved progress has been loaded.</span>
                <button
                  onClick={handleDiscardDraft}
                  className="text-xs text-amber-600 hover:text-amber-800 underline shrink-0"
                >
                  Discard draft
                </button>
              </div>
            )}

            {/* Draft saved feedback */}
            {draftSaved && (
              <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
                <Save className="w-4 h-4 shrink-0" />
                Draft saved — your progress is stored locally and will be restored next time.
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Success banner */}
            {createdShipment && (
              <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Shipment <span className="font-medium">{createdShipment.shipmentId}</span> {isEditMode ? "updated" : "created"} successfully!
              </div>
            )}

            {/* Section 1: Destinations */}
            <SectionHeader
              icon={<MapPin className="w-4 h-4" />}
              title="Destinations & Items"
              description="Add destinations and their respective shipment items"
              number={1}
            />
            <div className="mt-5 space-y-6">
              {dealerEntries.map((entry, index) => (
                <DestinationEntry
                  key={entry.id}
                  entry={entry}
                  index={index}
                  canRemove={dealerEntries.length > 1}
                  onRemove={removeEntry}
                  onUpdate={updateEntry}
                  lrNumber={
                    createdShipment?.destinations?.[index]?.lrNumber
                    ?? (nextIds ? `${nextIds.lrPrefix}-${String(index + 1).padStart(2, "0")}` : null)
                  }
                  usedPlantNumbers={
                    dealerEntries
                      .filter((e) => e.id !== entry.id)
                      .map((e) => [e.plantReferenceNumber, ...(e.additionalPlants || [])])
                      .flat()
                      .filter(Boolean)
                  }
                  onAddRelatedPlant={(plantRef) => addRelatedPlant(entry.id, plantRef)}
                  onRemoveRelatedPlant={(plantRef) => removeRelatedPlant(entry.id, plantRef)}
                  isEditMode={isEditMode}
                  initialInvoices={editShipment ? (editShipment.destinations?.[index]?.invoiceIds || []) : []}
                />
              ))}
              <Button
                variant="outline"
                onClick={addEntry}
                className="w-full py-6 border-dashed border-2 hover:bg-[#f0f4ff] hover:text-[#1d4ed8] hover:border-[#c7d7fe] transition-colors bg-[#fafbfc]"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Another Destination
              </Button>
            </div>

            <Separator className="my-8" />

            {/* Section 2: Vehicle & Driver */}
            <SectionHeader
              icon={<Truck className="w-4 h-4" />}
              title="Vehicle & Driver Assignment"
              description="Assign transport and driver for this shipment"
              number={2}
            />
            <div className="mt-5">
              <VehicleDriverSection
                vehicleId={vehicleId} setVehicleId={setVehicleId}
                vehicleOpen={vehicleOpen} setVehicleOpen={setVehicleOpen}
                driverId={driverId} setDriverId={setDriverId}
                vehicles={vehicles} loadingV={loadingV}
              />
            </div>

            {/* Summary */}
            <div className="mt-8">
              <ShipmentSummaryCard
                totalTyresAll={totalTyresAll}
                totalTubesAll={totalTubesAll}
                totalFlapsAll={totalFlapsAll}
                totalQuantity={totalQuantity}
                totalWeight={totalWeight}
                selectedVehicle={vehicles.find((v) => v._id === vehicleId)}
              />
            </div>
            <div className="h-6" />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-white px-8 py-4 flex items-center justify-between shrink-0">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => { resetForm(); onOpenChange(false); }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            {/* Save Draft — only in create mode */}
            {!isEditMode && (
              <Button
                variant="outline"
                className="border-border gap-2"
                disabled={submitting}
                onClick={handleSaveDraft}
              >
                <Save className="w-3.5 h-3.5" />
                Save Draft
              </Button>
            )}
            <Button
              className="gap-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white shadow-sm min-w-[160px]"
              onClick={handleCreate}
              disabled={submitting || !!createdShipment}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {isEditMode ? "Updating..." : "Creating..."}</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> {isEditMode ? "Update Shipment" : "Create Shipment"}</>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default CreateShipmentSheet;
