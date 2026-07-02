import { Truck, User, Phone } from "lucide-react";
import { Badge } from "../../ui/badge";
import { SectionLabel, DetailField } from "../ui/ShipmentUIComponents";

export function VehicleDriverDetails({ shipment, detail, loadUtil }) {
  // Prefer populated vehicleId/driverId objects if available
  const vehicleObj = shipment?.vehicleId && typeof shipment.vehicleId === "object"
    ? shipment.vehicleId : null;
  const driverObj  = shipment?.driverId  && typeof shipment.driverId  === "object"
    ? shipment.driverId  : null;

  const vehicleType    = vehicleObj?.type        ?? detail.vehicleType    ?? "—";
  const vehicleNumber  = vehicleObj?.vehicleNo   ?? shipment.vehicleNumber ?? "—";
  const vehicleCapacity = vehicleObj?.capacityKg ?? detail.vehicleCapacity ?? 0;
  const vehicleModel   = vehicleObj?.model       ?? detail.vehicleModel   ?? "";

  const driverName    = driverObj?.name          ?? shipment.driverName   ?? "—";
  const driverPhone   = driverObj?.phone         ?? shipment.driverPhone  ?? "—";
  const driverLicense = driverObj?.licenseNumber ?? detail.driverLicense  ?? "—";
  const driverType    = driverObj?.driverType    ?? detail.driverType     ?? "—";

  return (
    <div>
      <SectionLabel icon={<Truck className="w-4 h-4" />} title="Vehicle & Driver Details" />
      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vehicle Card */}
        <div className="bg-white border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-foreground">Vehicle Information</p>
              <p className="text-xs text-muted-foreground">Transport details</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DetailField label="Vehicle Type">
              <Badge
                variant="outline"
                className={`text-[11px] px-2 py-0.5 rounded-md ${
                  vehicleType === "Own"
                    ? "border-blue-200 text-blue-600 bg-blue-50/60"
                    : "border-orange-200 text-orange-600 bg-orange-50/60"
                }`}
              >
                {vehicleType}
              </Badge>
            </DetailField>
            <DetailField label="Vehicle Number" value={vehicleNumber} />
            <DetailField label="Capacity"       value={vehicleCapacity ? `${vehicleCapacity} kg` : "—"} />
            {vehicleModel && <DetailField label="Model" value={vehicleModel} />}
            <DetailField label="Load Utilization">
              <div className="space-y-1.5">
                <span className={`text-sm ${loadUtil > 90 ? "text-red-600" : loadUtil > 70 ? "text-amber-600" : "text-foreground"}`}>
                  {loadUtil}%
                </span>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      loadUtil > 90 ? "bg-red-500" : loadUtil > 70 ? "bg-amber-500" : "bg-[#1d4ed8]"
                    }`}
                    style={{ width: `${Math.min(loadUtil, 100)}%` }}
                  />
                </div>
              </div>
            </DetailField>
          </div>
        </div>

        {/* Driver Card */}
        <div className="bg-white border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-foreground">Driver Information</p>
              <p className="text-xs text-muted-foreground">Assigned driver details</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DetailField label="Driver Name" value={driverName} />
            <DetailField label="Phone Number">
              <span className="text-sm text-foreground flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-emerald-500" />{driverPhone}
              </span>
            </DetailField>
            <DetailField label="License Number" value={driverLicense} />
            <DetailField label="Driver Type">
              <Badge
                variant="outline"
                className={`text-[11px] px-2 py-0.5 rounded-md ${
                  driverType === "Own"
                    ? "border-emerald-200 text-emerald-600 bg-emerald-50/60"
                    : "border-violet-200 text-violet-600 bg-violet-50/60"
                }`}
              >
                {driverType}
              </Badge>
            </DetailField>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleDriverDetails;
