import { Truck, User, Phone, UserCheck, Sparkles } from "lucide-react";
import { Badge } from "../../ui/badge";
import { SectionLabel, DetailField } from "../ui/ShipmentUIComponents";

export function VehicleDriverDetails({ shipment, detail, loadUtil }) {
  // Prefer populated vehicleId/driverId/supervisorId objects if available
  const vehicleObj = shipment?.vehicleId && typeof shipment.vehicleId === "object"
    ? shipment.vehicleId : null;
  const driverObj  = shipment?.driverId  && typeof shipment.driverId  === "object"
    ? shipment.driverId  : null;
  const supervisorObj = shipment?.supervisorId && typeof shipment.supervisorId === "object"
    ? shipment.supervisorId : null;

  const vehicleType    = vehicleObj?.type        ?? detail.vehicleType    ?? "—";
  const vehicleNumber  = vehicleObj?.vehicleNo   ?? shipment.vehicleNumber ?? "—";
  const vehicleCapacity = vehicleObj?.capacityKg ?? detail.vehicleCapacity ?? 0;
  const vehicleModel   = vehicleObj?.model       ?? detail.vehicleModel   ?? "";

  const driverName    = driverObj?.name          ?? shipment.driverName   ?? "—";
  const driverPhone   = driverObj?.phone         ?? shipment.driverPhone  ?? "—";
  const driverLicense = driverObj?.licenseNumber ?? detail.driverLicense  ?? "—";
  const driverType    = driverObj?.driverType    ?? detail.driverType     ?? "—";

  const supervisorName = supervisorObj?.name ?? shipment.supervisorName ?? "—";
  const supervisorEmployeeId = supervisorObj?.employeeId ?? shipment.supervisorEmployeeId ?? "";
  const supervisorPhone = supervisorObj?.phone ?? shipment.supervisorPhone ?? "";

  return (
    <div>
      <SectionLabel icon={<Truck className="w-4 h-4" />} title="Vehicle, Driver & Supervisor Details" />
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Vehicle Card */}
        <div className="bg-white border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-foreground font-semibold">Vehicle Information</p>
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
                <span className={`text-sm font-medium ${loadUtil > 90 ? "text-red-600" : loadUtil > 70 ? "text-amber-600" : "text-foreground"}`}>
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
              <p className="text-sm text-foreground font-semibold">Driver Information</p>
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

        {/* Supervisor Card */}
        <div className="bg-white border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-foreground font-semibold">Supervisor</p>
              <p className="text-xs text-muted-foreground">Assigned supervisor details</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DetailField label="Supervisor Name" value={supervisorName} />
            <DetailField label="Designation">
              <Badge
                variant="outline"
                className="border-indigo-200 text-indigo-600 bg-indigo-50/60 text-[11px] px-2 py-0.5 rounded-md"
              >
                Supervisor
              </Badge>
            </DetailField>
            <DetailField label="Employee ID">
              {supervisorEmployeeId ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-xs font-mono font-medium">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  {supervisorEmployeeId}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </DetailField>
            {supervisorPhone && (
              <DetailField label="Phone Number">
                <span className="text-sm text-foreground flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-indigo-500" />{supervisorPhone}
                </span>
              </DetailField>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default VehicleDriverDetails;
