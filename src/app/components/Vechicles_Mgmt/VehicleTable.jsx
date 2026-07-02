import {
  Truck,
  Eye,
  MoreHorizontal,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

/* ── STYLE MAPS ─────────────────────────────────── */
const statusStyles = {
  Active: {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  "In Transit": {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  Assigned: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  Maintenance: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  Idle: { bg: "bg-slate-50 border-slate-200", text: "text-slate-600" },
  Breakdown: { bg: "bg-red-50 border-red-200", text: "text-red-700" },
};

const availabilityStyles = {
  Available: {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
  },
  "On Trip": { bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  Assigned: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  Unavailable: { bg: "bg-red-50 border-red-200", text: "text-red-700" },
  Scheduled: { bg: "bg-violet-50 border-violet-200", text: "text-violet-700" },
};

const vehicleTypeBadge = {
  Truck: "bg-blue-50 text-blue-700 border-blue-200",
  "Mini Truck": "bg-teal-50 text-teal-700 border-teal-200",
  Trailer: "bg-purple-50 text-purple-700 border-purple-200",
  Container: "bg-orange-50 text-orange-700 border-orange-200",
  Tanker: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

/* ── HELPERS ─────────────────────────────────── */
function formatWeight(kg) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} T`;
  return `${kg} kg`;
}

function isExpiringSoon(dateStr) {
  const expiry = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.floor(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays <= 60;
}

function isExpired(dateStr) {
  const expiry = new Date(dateStr);
  const today = new Date();
  return expiry < today;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ExpiryCell({ date, expired, expiring }) {
  return (
    <span
      className={`text-sm flex items-center gap-1.5 whitespace-nowrap ${
        expired
          ? "text-red-600"
          : expiring
            ? "text-amber-600"
            : "text-foreground"
      }`}
    >
      {expired ? (
        <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
      ) : expiring ? (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      )}
      {formatDate(date)}
    </span>
  );
}

function VehicleTableRow({
  vehicle,
  onEditVehicle,
  onDeleteVehicle,
  onScheduleMaintenance,
  onTrackLocation,
}) {
  const sts = statusStyles[vehicle.status] || {
    bg: "bg-slate-50 border-slate-200",
    text: "text-slate-600",
    dot: "bg-slate-400"
  };
  const avail = availabilityStyles[vehicle.availability] || {
    bg: "bg-slate-50 border-slate-200",
    text: "text-slate-600"
  };
  const typeBadge = vehicleTypeBadge[vehicle.type] || "bg-slate-50 text-slate-700 border-slate-200";
  const insExpiring = isExpiringSoon(vehicle.insuranceExpiry);
  const insExpired = isExpired(vehicle.insuranceExpiry);
  const isMaintenance = vehicle.status === "Maintenance";

  return (
    <TableRow className="group hover:bg-[#f8f9fb]/60 transition-colors">
      {/* Vehicle No */}
      <TableCell className="py-3.5 pl-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <Truck className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div>
            <p className="text-sm text-foreground whitespace-nowrap">
              {vehicle.vehicleNo}
            </p>
            <p className="text-[11px] text-muted-foreground"> {vehicle.vehicleId}</p>
          </div>
        </div>
      </TableCell>

      {/* Type */}
      <TableCell className="py-3.5">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border whitespace-nowrap ${typeBadge}`}
        >
          {vehicle.type}
        </span>
      </TableCell>

      {/* Model */}
      <TableCell className="py-3.5">
        <p className="text-sm text-foreground whitespace-nowrap">
          {vehicle.model}
        </p>
      </TableCell>

      {/* Capacity */}
      <TableCell className="py-3.5">
        <span className="text-sm text-foreground tabular-nums">
          {formatWeight(vehicle.capacityKg)}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell className="py-3.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border whitespace-nowrap ${sts.bg} ${sts.text}`}
        >
          {sts.dot && (
            <span className="relative flex h-2 w-2">
              {(vehicle.status === "In Transit" || vehicle.status === "Active") && (
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sts.dot}`}
                />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${sts.dot}`}
              />
            </span>
          )}
          {vehicle.status === "Maintenance" && <Wrench className="w-3 h-3" />}
          {vehicle.status === "Breakdown" && (
            <AlertTriangle className="w-3 h-3" />
          )}
          {vehicle.status}
        </span>
      </TableCell>

      {/* Insurance Expiry */}
      <TableCell className="py-3.5">
        <ExpiryCell
          date={vehicle.insuranceExpiry}
          expired={insExpired}
          expiring={insExpiring}
        />
      </TableCell>

      {/* Availability */}
      <TableCell className="py-3.5">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border whitespace-nowrap ${avail.bg} ${avail.text}`}
        >
          {vehicle.availability}
        </span>
      </TableCell>

      {/* Ownership */}
      <TableCell className="py-3.5">
        <span className="text-sm text-foreground">{vehicle.ownership}</span>
      </TableCell>

      {/* Action */}
      <TableCell className="py-3.5 pr-5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {/* Edit */}
            <DropdownMenuItem
              className="text-xs gap-2 cursor-pointer"
              onClick={() => onEditVehicle(vehicle)}
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Vehicle
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Schedule Maintenance */}
            <DropdownMenuItem
              className="text-xs gap-2 cursor-pointer"
              onClick={() => onScheduleMaintenance(vehicle)}
            >
              {isMaintenance ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  Remove Maintenance
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Schedule Maintenance
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function VehicleTable({
  vehicles,
  totalVehicles,
  loading,
  onEditVehicle,
  onDeleteVehicle,
  onScheduleMaintenance,
  onTrackLocation,
}) {
  return (
    <div className="px-6 pb-6 flex-1 min-h-0 overflow-auto">
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f8f9fb] hover:bg-[#f8f9fb]">
                <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3 pl-5 whitespace-nowrap">
                  Vehicle No
                </TableHead>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3 whitespace-nowrap">
                  Type
                </TableHead>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3 whitespace-nowrap">
                  Model
                </TableHead>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3 whitespace-nowrap">
                  Capacity (kg)
                </TableHead>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3 whitespace-nowrap">
                  Status
                </TableHead>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3 whitespace-nowrap">
                  Insurance Expiry
                </TableHead>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3 whitespace-nowrap">
                  Availability
                </TableHead>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3 whitespace-nowrap">
                  Ownership
                </TableHead>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3 pr-5 whitespace-nowrap text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-16 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Truck className="w-8 h-8 text-muted-foreground/40" />
                      <p className="text-sm">No vehicles found</p>
                      <p className="text-xs text-muted-foreground/70">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => (
                  <VehicleTableRow
                    key={vehicle._id}
                    vehicle={vehicle}
                    onEditVehicle={onEditVehicle}
                    onDeleteVehicle={onDeleteVehicle}
                    onScheduleMaintenance={onScheduleMaintenance}
                    onTrackLocation={onTrackLocation}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-[#f8f9fb]/50 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {vehicles.length} of {totalVehicles} vehicles
          </p>
        </div>
      </div>
    </div>
  );
}
