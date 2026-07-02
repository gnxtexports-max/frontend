import { Fuel, Droplets, TrendingDown, Gauge, Route, Navigation, AlertTriangle } from "lucide-react";
import { SectionTitle } from "./VehicleTrackingUIComponents";

export function FuelInfoSection({ data }) {
  const currentFuel = data.distanceCovered > 0
    ? Math.max(200 - Math.round(data.distanceCovered / 3.8), 0)
    : 200;
  const fuelPercent = currentFuel / 200;

  const fuelStatusClass =
    fuelPercent < 0.25
      ? "bg-red-50 text-red-700 border border-red-200"
      : fuelPercent < 0.5
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-emerald-50 text-emerald-700 border border-emerald-200";

  const fuelStatusLabel =
    fuelPercent < 0.25 ? "Low" : fuelPercent < 0.5 ? "Moderate" : "Good";

  const fuelBarClass =
    fuelPercent < 0.25
      ? "bg-red-500"
      : fuelPercent < 0.5
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div>
      <SectionTitle icon={<Fuel className="w-4 h-4" />} title="Fuel Information" />

      <div className="mt-3 bg-white border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-[10px] text-muted-foreground uppercase tracking-wider px-4 py-3">Parameter</th>
              <th className="text-left text-[10px] text-muted-foreground uppercase tracking-wider px-4 py-3">Value</th>
              <th className="text-left text-[10px] text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* Tank Capacity */}
            <tr className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Fuel className="w-3.5 h-3.5 text-amber-600" />
                  Tank Capacity
                </span>
              </td>
              <td className="px-4 py-3 text-foreground tabular-nums">200 L</td>
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Full Tank</span>
              </td>
            </tr>

            {/* Current Fuel Level */}
            <tr className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                  Current Fuel Level
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-foreground tabular-nums">{currentFuel} L</span>
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${fuelBarClass}`}
                      style={{ width: `${fuelPercent * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {Math.round(fuelPercent * 100)}%
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${fuelStatusClass}`}>
                  {fuelStatusLabel}
                </span>
              </td>
            </tr>

            {/* Fuel Consumed */}
            <tr className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 text-muted-foreground">
                <span className="flex items-center gap-2">
                  <TrendingDown className="w-3.5 h-3.5 text-[#1d4ed8]" />
                  Fuel Consumed
                </span>
              </td>
              <td className="px-4 py-3 text-foreground tabular-nums">
                {data.distanceCovered > 0 ? `${Math.round(data.distanceCovered / 3.8)} L` : "0 L"}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                {data.distanceCovered > 0
                  ? `₹${(Math.round(data.distanceCovered / 3.8) * 89.5).toLocaleString("en-IN", { maximumFractionDigits: 0 })} cost`
                  : "—"}
              </td>
            </tr>

            {/* Mileage */}
            <tr className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-violet-600" />
                  Mileage (Avg)
                </span>
              </td>
              <td className="px-4 py-3 text-foreground tabular-nums">3.8 km/L</td>
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Standard
                </span>
              </td>
            </tr>

            {/* Fuel at Departure */}
            <tr className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Fuel className="w-3.5 h-3.5 text-blue-500" />
                  Fuel at Departure
                </span>
              </td>
              <td className="px-4 py-3 text-foreground tabular-nums">200 L (Full)</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">Pre-trip filled</td>
            </tr>

            {/* Est. Fuel for Full Trip */}
            <tr className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Route className="w-3.5 h-3.5 text-amber-500" />
                  Est. Fuel for Full Trip
                </span>
              </td>
              <td className="px-4 py-3 text-foreground tabular-nums">
                {data.totalDistance > 0 ? `${Math.round(data.totalDistance / 3.8)} L` : "—"}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                {data.totalDistance > 0
                  ? `₹${(Math.round(data.totalDistance / 3.8) * 89.5).toLocaleString("en-IN", { maximumFractionDigits: 0 })} est. total`
                  : "—"}
              </td>
            </tr>

            {/* Est. Remaining Range */}
            <tr className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                  Est. Remaining Range
                </span>
              </td>
              <td className="px-4 py-3 text-foreground tabular-nums">
                {data.distanceCovered > 0
                  ? `${Math.max(Math.round((200 - data.distanceCovered / 3.8) * 3.8), 0)} km`
                  : "760 km"}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {data.remainingDistance > 0
                  ? `${data.remainingDistance} km to destination`
                  : "Trip completed"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Low fuel warning */}
      {fuelPercent < 0.25 && data.remainingDistance > 0 && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-sm text-red-700">
            Low fuel warning — estimated {currentFuel}L remaining. Vehicle may need refueling before
            reaching destination.
          </p>
        </div>
      )}
    </div>
  );
}

export default FuelInfoSection;
