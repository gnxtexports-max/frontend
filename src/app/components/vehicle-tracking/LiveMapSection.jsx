import { MapPin, Building2, Truck, Clock } from "lucide-react";
import { SectionTitle } from "./VehicleTrackingUIComponents";

export function LiveMapSection({ data }) {
  return (
    <div>
      <SectionTitle icon={<MapPin className="w-4 h-4" />} title="Live Map Preview" />

      {/* Map canvas */}
      <div className="mt-3 bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] border border-[#c7d7fe] rounded-xl min-h-[320px] p-6 relative overflow-hidden">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Route visualization */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[260px] gap-6">
          <div className="flex items-center gap-3">
            {/* Warehouse pin */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-[#1d4ed8] flex items-center justify-center shadow-lg shadow-blue-200">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] text-[#4338ca] max-w-[80px] text-center leading-tight">
                {data.warehouseLocation.split(",")[0]}
              </span>
            </div>

            {/* Route line + vehicle */}
            <div className="flex items-center relative">
              <div
                className="h-1 bg-[#1d4ed8] rounded-l-full"
                style={{ width: `${Math.max(data.percentComplete * 2, 20)}px` }}
              />
              {data.status !== "Idle" && (
                <div className="relative mx-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                      data.status === "Moving"
                        ? "bg-[#1d4ed8] shadow-blue-300"
                        : "bg-red-500 shadow-red-200"
                    }`}
                  >
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  {data.status === "Moving" && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
              )}
              <div
                className="h-1 bg-[#c7d7fe] rounded-r-full"
                style={{ width: `${Math.max((100 - data.percentComplete) * 2, 20)}px` }}
              />
            </div>

            {/* Dealer pin */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                  data.percentComplete === 100
                    ? "bg-emerald-500 shadow-emerald-200"
                    : "bg-[#6366f1]/30 shadow-indigo-100"
                }`}
              >
                <MapPin
                  className={`w-6 h-6 ${
                    data.percentComplete === 100 ? "text-white" : "text-[#4338ca]"
                  }`}
                />
              </div>
              <span className="text-[10px] text-[#4338ca] max-w-[80px] text-center leading-tight">
                {data.dealerLocation.split(",")[0]}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#6366f1]/70">
            {data.distanceCovered} km of {data.totalDistance} km covered
          </p>
        </div>
      </div>

      {/* Location details row */}
      <div className="mt-3 bg-white border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Current Location
            </p>
            <p className="text-sm text-foreground mt-1">{data.currentLocation.area}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Lat / Long
            </p>
            <p className="text-sm text-foreground mt-1 tabular-nums">
              {data.currentLocation.lat} N, {data.currentLocation.lng} E
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Last Updated
            </p>
            <p className="text-sm text-foreground mt-1">{data.currentLocation.lastUpdated}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveMapSection;
