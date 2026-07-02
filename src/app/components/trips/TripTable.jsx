import {
  Search,
  Truck,
  MapPin,
  Phone,
  Eye,
  Route,
  Navigation,
  Gauge,
  AlertTriangle,
  Locate,
  Check,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { statusStyles } from "./data/tripData";

export function TripTable({ filteredVehicles, onNavigate }) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex-1 overflow-hidden flex flex-col">
      {/* Table Header Bar */}
      <div className="px-5 py-3 border-b border-border bg-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#eef2ff] border border-[#c7d7fe] flex items-center justify-center">
            <Locate className="w-3.5 h-3.5 text-[#4338ca]" />
          </div>
          <h3 className="text-sm text-foreground">Tracking Vehicles</h3>
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0.5 rounded-md border-[#c7d7fe] text-[#4338ca] bg-[#eef2ff]"
          >
            {filteredVehicles.length} active
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Click <Eye className="w-3 h-3 inline-block mx-0.5" /> to open full tracking view
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-[#fafbfc]">
              <TableHead className="pl-5 w-[150px]">Vehicle</TableHead>
              <TableHead className="w-[180px]">Driver</TableHead>
              <TableHead className="w-[180px]">Shipment</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
              <TableHead className="w-[130px] pr-5 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.map((vehicle) => {
              const ss = statusStyles[vehicle.status] || {
                bg: "bg-slate-50 border-slate-200",
                text: "text-slate-600",
                dot: "bg-slate-500",
              };
              return (
                <TableRow
                  key={vehicle.vehicleNumber}
                  className="group cursor-pointer hover:bg-[#fafbfe] transition-colors"
                  onClick={() => onNavigate(vehicle.vehicleNumber)}
                >
                  {/* Vehicle */}
                  <TableCell className="pl-5">
                    <div>
                      <span className="text-sm text-[#1d4ed8]">{vehicle.vehicleNumber}</span>
                      <div className="mt-0.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 rounded-sm ${vehicle.vehicleType === "Own"
                            ? "border-blue-200 text-blue-600 bg-blue-50/60"
                            : "border-orange-200 text-orange-600 bg-orange-50/60"
                            }`}
                        >
                          {vehicle.vehicleType}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>

                  {/* Driver */}
                  <TableCell>
                    <div>
                      <p className="text-sm text-foreground">{vehicle.driverName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" />
                        {vehicle.driverPhone}
                      </p>
                    </div>
                  </TableCell>

                  {/* Shipment */}
                  <TableCell>
                    <div>
                      <span className="text-sm text-[#1d4ed8]">{vehicle.shipmentId}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[120px]">
                        {vehicle.dealerName}
                      </p>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${ss.bg} ${ss.text}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${ss.dot} ${vehicle.status === "Moving" ? "animate-pulse" : ""
                          }`}
                      />
                      {vehicle.status}
                    </span>
                  </TableCell>

                  {/* View Tracking Button */}
                  <TableCell className="pr-5 text-center">
                    <div className="flex items-center justify-end gap-2">
                      {vehicle.shipmentStatus && !vehicle.hasReturnedDate && vehicle.shipmentStatus !== "Cancelled" && (
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm h-8 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onMarkArrival) onMarkArrival(vehicle.shipmentDbId);
                          }}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Arrival
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs border-[#c7d7fe] text-[#1d4ed8] hover:bg-[#eef2ff] hover:border-[#a5b4fc] transition-all h-8 px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(vehicle.vehicleNumber);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Tracking
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredVehicles.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="w-8 h-8 text-muted-foreground/40" />
                    <p className="text-sm">No vehicles found</p>
                    <p className="text-xs text-muted-foreground/70">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Table Footer */}
      <div className="border-t border-border px-5 py-3 flex items-center justify-between bg-[#fafbfc]">
        <p className="text-xs text-muted-foreground font-semibold">
          Showing {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? "s" : ""} in fleet control
        </p>
      </div>
    </div>
  );
}
export default TripTable;
