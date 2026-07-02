import { Hash, Layers, Weight, AlertTriangle } from "lucide-react";
import { SummaryMetric } from "../ui/ShipmentUIComponents";

export function ShipmentSummaryCard({
  totalTyresAll,
  totalTubesAll,
  totalFlapsAll,
  totalQuantity,
  totalWeight,
  selectedVehicle,
}) {
  const vehicleCapacity = selectedVehicle ? (selectedVehicle.capacityKg || selectedVehicle.capacity || 0) : 0;
  const overCapacity = selectedVehicle && totalWeight > vehicleCapacity;

  return (
    <div className="bg-[#fafbfc] border border-border rounded-xl p-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryMetric icon={<Hash className="w-4 h-4 text-[#1d4ed8]" />}   label="Total Tyres"    value={`${totalTyresAll}`} />
        <SummaryMetric icon={<Hash className="w-4 h-4 text-[#6366f1]" />}   label="Total Tubes"    value={`${totalTubesAll}`} />
        <SummaryMetric icon={<Hash className="w-4 h-4 text-[#8b5cf6]" />}   label="Total Flaps"    value={`${totalFlapsAll}`} />
        <SummaryMetric icon={<Layers className="w-4 h-4 text-[#1d4ed8]" />} label="Total Quantity" value={`${totalQuantity}`} />
        <SummaryMetric icon={<Weight className="w-4 h-4 text-[#1d4ed8]" />} label="Total Weight"   value={`${totalWeight} kg`} />
      </div>

      {overCapacity && (
        <div className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Weight exceeds vehicle capacity</p>
            <p className="text-xs text-red-600 mt-0.5">
              Total weight ({totalWeight} kg) exceeds the selected vehicle capacity ({vehicleCapacity} kg) by{" "}
              {totalWeight - vehicleCapacity} kg. Please reduce items or select a larger vehicle.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShipmentSummaryCard;
