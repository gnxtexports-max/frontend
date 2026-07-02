import { useState } from "react";
import { Eye, FileCheck, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";
import { TableRow, TableCell } from "../ui/table";
import { Badge } from "../ui/badge";
import { getPODConfig, statusConfig, getDisplayStatus, getDeliveryProgress } from "./utils/shipmentStyles";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

export function PlantRow({
  shipment,
  setSelectedShipment,
  setViewSheetOpen,
  setEditShipment,       // opens CreateShipmentSheet in edit mode
  setShipmentData,
  onDeleted,
}) {
  const { user, hasPermission } = useAuth();
  const canEdit = hasPermission("Shipments", "edit");
  const canDelete = user?.role === "Super Admin";

  const [openPlants, setOpenPlants] = useState(false);
  const displayStatus = getDisplayStatus(shipment);
  const deliveryProgress = getDeliveryProgress(shipment);
  const isPartialDelivered = deliveryProgress && deliveryProgress.delivered < deliveryProgress.total;
  const sc = isPartialDelivered
    ? { label: displayStatus, className: "bg-blue-50 text-blue-700 border-blue-200" }
    : (statusConfig[shipment.status] || { label: displayStatus, className: "bg-gray-50 text-gray-700 border-gray-200" });
  const pod = getPODConfig(shipment);

  const dest = shipment.destinations?.[0] ?? {};

  // Collect all unique plant numbers across all destinations of this shipment
  const allPlants = (shipment.destinations ?? [])
    .flatMap((d) => (d.plantReferenceNumber || "").split(",").map((p) => p.trim()))
    .filter(Boolean);
  const plantNumbers = [...new Set(allPlants)];

  // Customer name & location — from denormalized dest fields (set at create/update time)
  // For older records: fall back to any populated invoice across all destinations
  const allPopulatedInvoices = (shipment.destinations ?? [])
    .flatMap((d) => (d.invoiceIds ?? []).filter((inv) => typeof inv === "object"));
  const firstPopulated = allPopulatedInvoices[0] ?? null;

  const customerName = dest.customerName || firstPopulated?.customerName || "—";
  const deliveryLocation = dest.deliveryLocation || firstPopulated?.location || "—";
  // Items & Weight
  const totalWeightKg = shipment.totalWeightKg ?? 0;
  const totalQuantity = shipment.totalQuantity ?? 0;

  // Date
  const date = shipment.createdAt
    ? new Date(shipment.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const handleDelete = async () => {
    if (!window.confirm(`Delete shipment ${shipment.shipmentId}?`)) return;
    try {
      await fetch(`${API_BASE_URL}/shipments/${shipment._id}`, { method: "DELETE", credentials: "include" });
      setShipmentData((prev) => prev.filter((s) => s._id !== shipment._id));
      if (onDeleted) onDeleted(shipment._id);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <TableRow className="group cursor-default hover:bg-muted/30">
      {/* Shipment ID (Primary Column) */}
      <TableCell className="pl-5">
        <span className="text-sm font-semibold text-[#1d4ed8] tracking-tight">{shipment.shipmentId}</span>
      </TableCell>

      {/* Plant Number (Dropdown or Badge) */}
      <TableCell>
        {(() => {
          if (plantNumbers.length > 1) {
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-semibold text-[#1d4ed8] bg-blue-50/60 hover:bg-blue-50 border border-blue-200/60 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer transition-all duration-150 shadow-sm"
                  >
                    <span className="truncate max-w-[80px]">{plantNumbers[0]}</span>
                    <span className="bg-[#1d4ed8] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">+{plantNumbers.length - 1}</span>
                    <svg className="w-3 h-3 text-[#1d4ed8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[140px] bg-white border border-border rounded-lg shadow-md py-1.5 text-xs font-semibold text-slate-700 z-50">
                  <DropdownMenuLabel className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-1">
                    Selected Plants
                  </DropdownMenuLabel>
                  {plantNumbers.map((p, idx) => (
                    <DropdownMenuItem
                      key={idx}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 hover:bg-slate-50 transition-colors border-b last:border-b-0 border-slate-100 font-bold text-slate-800 cursor-default"
                    >
                      {p}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }
          if (plantNumbers.length === 1) {
            return (
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200/60 px-2.5 py-1.5 rounded-md">
                {plantNumbers[0]}
              </span>
            );
          }
          return <span className="text-xs font-semibold text-slate-400">—</span>;
        })()}
      </TableCell>

      {/* Dealer & Location — customerName + district from invoice */}
      <TableCell>
        <div>
          <p className="text-sm text-foreground font-medium">{customerName}</p>
          {deliveryLocation !== "—" && (
            <p className="text-xs text-muted-foreground mt-0.5">{deliveryLocation}</p>
          )}
        </div>
      </TableCell>

      {/* Items & Weight */}
      <TableCell>
        <div className="flex items-center gap-2">
          <PackageIcon />
          <div>
            <span className="text-sm text-foreground">{totalWeightKg} kg</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
      </TableCell>

      {/* Driver Info */}
      <TableCell>
        <div>
          <p className="text-sm text-foreground">{shipment.driverName || "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{shipment.driverPhone || ""}</p>
        </div>
      </TableCell>

      {/* Vehicle Info */}
      <TableCell>
        <div>
          <p className="text-sm text-foreground">{shipment.vehicleNumber || "—"}</p>
          {shipment.vehicleCapacityKg && (
            <Badge variant="outline" className="mt-0.5 text-[10px] px-1.5 py-0 rounded-sm border-blue-200 text-blue-600 bg-blue-50/60">
              {shipment.vehicleCapacityKg} kg
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Date */}
      <TableCell>
        <span className="text-sm text-muted-foreground">{date}</span>
      </TableCell>

      {/* Status */}
      <TableCell>
        <span className={`inline-flex items-center text-[11px] px-2.5 py-1 rounded-full border ${sc.className}`}>
          {sc.label}
        </span>
      </TableCell>

      {/* POD */}
      <TableCell>
        <span
          className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border ${pod.className}${shipment.status === "Delivered" ? " cursor-pointer hover:bg-emerald-100 hover:border-emerald-300 transition-colors" : ""
            }`}
          role={shipment.status === "Delivered" ? "button" : undefined}
          onClick={shipment.status === "Delivered" ? () => { setSelectedShipment(shipment); setViewSheetOpen(true); } : undefined}
        >
          {pod.icon && <FileCheck className="w-3 h-3" />}
          {pod.label}
        </span>
      </TableCell>

      {/* View / Edit / Delete */}
      <TableCell className="pr-5">
        <div className="flex items-center gap-1">
          {/* View */}
          <button
            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            onClick={() => { setSelectedShipment(shipment); setViewSheetOpen(true); }}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {/* Edit — opens CreateShipmentSheet pre-filled */}
          {canEdit && (
            <button
              className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-blue-50 transition-colors text-muted-foreground hover:text-[#1d4ed8]"
              onClick={() => setEditShipment && setEditShipment(shipment)}
              title="Edit Shipment"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {/* Delete */}
          {canDelete && (
            <button
              className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"
              onClick={handleDelete}
              title="Delete"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function PackageIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l6 3.46a2 2 0 0 0 2 0l6-3.46A2 2 0 0 0 21 16z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

export default PlantRow;
