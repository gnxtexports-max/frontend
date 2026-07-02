import { Calendar, Clock } from "lucide-react";
import { KpiCard } from "./VehicleTrackingUIComponents";

export function KpiCards({ departedTime, arrivedTime }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <KpiCard
        icon={<Calendar className="w-4 h-4 text-[#1d4ed8]" />}
        label="Departed Time"
        value={departedTime || "---"}
      />
      <KpiCard
        icon={<Clock className="w-4 h-4 text-[#1d4ed8]" />}
        label="Arrived Time"
        value={arrivedTime || "---"}
      />
    </div>
  );
}

export default KpiCards;
