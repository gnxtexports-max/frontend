import { Layers, Weight, Hash, CircleDot, Disc, Circle } from "lucide-react";
import { Separator } from "../../ui/separator";
import { SectionLabel, SummaryPill } from "../ui/ShipmentUIComponents";

export function ItemsBreakdown({ shipment, detail, totalQty, totalWt }) {
  // Use real destination data from the shipment if available
  const destinations = shipment?.destinations ?? [];

  // Aggregate counts across all destinations
  const tyreCount = destinations.reduce((s, d) => s + (d.totalTyres || 0), 0)
    || detail.items.filter((i) => i.type === "Tyre").reduce((s, i) => s + i.quantity, 0);
  const flapCount = destinations.reduce((s, d) => s + (d.totalFlaps || 0), 0)
    || detail.items.filter((i) => i.type === "Flap").reduce((s, i) => s + i.quantity, 0);
  const tubeCount = destinations.reduce((s, d) => s + (d.totalTubes || 0), 0)
    || detail.items.filter((i) => i.type === "Tube").reduce((s, i) => s + i.quantity, 0);

  return (
    <div>
      <SectionLabel icon={<Layers className="w-4 h-4" />} title="Shipment Items Breakdown" />
      <div className="mt-3 bg-white border border-border rounded-xl overflow-hidden">
        {/* Summary row */}
        <div className="bg-[#fafbfc] px-5 py-3 space-y-2.5">
          <div className="flex items-center gap-6">
            <SummaryPill icon={<Weight className="w-3.5 h-3.5 text-[#1d4ed8]" />} label="Total Weight" value={`${totalWt} kg`} />
            <SummaryPill icon={<Hash className="w-3.5 h-3.5 text-[#1d4ed8]" />}   label="Total Items"  value={`${totalQty}`} />
          </div>
          <Separator />
          <div className="flex items-center gap-6">
            <SummaryPill icon={<CircleDot className="w-3.5 h-3.5 text-blue-600" />}  label="Total Tyres" value={`${tyreCount}`} />
            <SummaryPill icon={<Disc className="w-3.5 h-3.5 text-amber-600" />}       label="Total Flaps" value={`${flapCount}`} />
            <SummaryPill icon={<Circle className="w-3.5 h-3.5 text-violet-600" />}    label="Total Tubes" value={`${tubeCount}`} />
          </div>
        </div>

        {/* Per-destination breakdown */}
        {destinations.length > 0 && (
          <div className="divide-y divide-border">
            {destinations.map((dest, idx) => (
              <div key={dest._id ?? idx} className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Destination {idx + 1}</p>
                  <p className="text-sm text-foreground mt-0.5">{dest.customerName || dest.plantReferenceNumber || "—"}</p>
                  {dest.deliveryLocation && (
                    <p className="text-xs text-muted-foreground">{dest.deliveryLocation}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">LR Number</p>
                  <p className="text-sm text-[#1d4ed8] mt-0.5">{dest.lrNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Items</p>
                  <p className="text-sm text-foreground mt-0.5">
                    {[
                      dest.totalTyres > 0 && `${dest.totalTyres} Tyres`,
                      dest.totalTubes > 0 && `${dest.totalTubes} Tubes`,
                      dest.totalFlaps > 0 && `${dest.totalFlaps} Flaps`,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Weight</p>
                  <p className="text-sm text-foreground mt-0.5">{dest.weightKg ?? 0} kg</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemsBreakdown;
