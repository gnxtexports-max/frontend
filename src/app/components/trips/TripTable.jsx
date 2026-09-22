import { useState, useRef } from "react";
import {
  Truck,
  Phone,
  Eye,
  Locate,
  Check,
  GripHorizontal,
  Maximize2,
  Minimize2,
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

export function TripTable({ filteredVehicles = [], onNavigate, onMarkArrival }) {
  const safeVehicles = Array.isArray(filteredVehicles) ? filteredVehicles : [];
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(380);

  // tableContentHeight controls the HEIGHT OF THE TABLE VIEWPORT/BODY AREA
  const [tableContentHeight, setTableContentHeight] = useState(() => {
    try {
      const saved = localStorage.getItem("fleet_control_table_content_height");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 140 && parsed <= 900) return parsed;
      }
    } catch (_) {}
    return 380;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Pointer events with capture for smooth drag resizing
  const handlePointerDown = (e) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = tableContentHeight;
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    // DRAG UP (delta < 0) -> table viewport height increases -> more rows become visible
    // DRAG DOWN (delta > 0) -> table viewport height decreases -> fewer rows become visible
    const delta = e.clientY - dragStartY.current;
    const maxHeight = typeof window !== "undefined" ? Math.floor(window.innerHeight * 0.70) : 700;
    const minHeight = 140;
    const newHeight = Math.min(Math.max(dragStartHeight.current - delta, minHeight), maxHeight);
    setTableContentHeight(newHeight);
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      setIsDragging(false);
      try {
        localStorage.setItem("fleet_control_table_content_height", String(tableContentHeight));
      } catch (_) {}
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };

  return (
    <div
      className={`bg-white rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col transition-shadow ${
        isFullScreen
          ? "fixed inset-6 z-50 shadow-2xl ring-1 ring-slate-900/10"
          : "relative"
      } ${isDragging ? "select-none shadow-md ring-1 ring-blue-400" : ""}`}
    >
      {/* ── TOP DRAG RESIZE HANDLE BAR ───────────────────── */}
      {!isFullScreen && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={() => setTableContentHeight(380)}
          title="Drag UP to increase table content area, drag DOWN to decrease (Double-click to reset)"
          style={{ touchAction: "none" }}
          className={`h-3.5 w-full border-b border-slate-200/80 bg-slate-50 hover:bg-blue-50/90 active:bg-blue-100 cursor-ns-resize flex items-center justify-center transition-colors select-none group shrink-0 ${
            isDragging ? "bg-blue-100 ring-1 ring-blue-300" : ""
          }`}
        >
          <div className="w-14 h-1 rounded-full bg-slate-300 group-hover:bg-blue-500 group-active:bg-blue-600 transition-colors" />
        </div>
      )}

      {/* Card Header */}
      <div className="px-5 py-3 border-b border-border bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#eef2ff] border border-[#c7d7fe] flex items-center justify-center">
            <Locate className="w-3.5 h-3.5 text-[#4338ca]" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Tracking Vehicles</h3>
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0.5 rounded-md border-[#c7d7fe] text-[#4338ca] bg-[#eef2ff]"
          >
            {safeVehicles.length} active
          </Badge>
        </div>

        <div className="flex items-center gap-2.5">
          {!isFullScreen && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 select-none">
              <GripHorizontal className="w-3 h-3 text-slate-400" />
              Drag to resize
            </span>
          )}

          <Button
            variant={isFullScreen ? "default" : "outline"}
            size="sm"
            onClick={toggleFullScreen}
            className={`h-7 px-2.5 text-xs gap-1.5 font-medium ${
              isFullScreen
                ? "bg-[#1d4ed8] hover:bg-blue-700 text-white shadow-sm"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            title={isFullScreen ? "Exit Full View" : "View Full Table"}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Full View</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full View</span>
              </>
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground border-l border-border pl-3">
            Click <Eye className="w-3 h-3 inline-block mx-0.5" /> to open tracking
          </p>
        </div>
      </div>

      {/* ── TABLE CONTENT CONTAINER / VIEWPORT (THIS RESIZES DYNAMICALLY) ── */}
      <div
        style={isFullScreen ? { flex: 1, overflowY: "auto" } : { height: `${tableContentHeight}px`, overflowY: "auto" }}
        className="relative [&_[data-slot=table-container]]:overflow-x-visible"
      >
        <Table className="w-full border-collapse">
          <TableHeader className="sticky top-0 z-20 bg-[#fafbfc] [&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-[#fafbfc] [&_th]:border-b [&_th]:border-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <TableRow className="hover:bg-transparent bg-[#fafbfc]">
              <TableHead className="pl-5 w-[150px]">Vehicle</TableHead>
              <TableHead className="w-[180px]">Driver</TableHead>
              <TableHead className="w-[180px]">Shipment</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead className="w-[140px] pr-5 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeVehicles.map((vehicle) => {
              const ss = statusStyles[vehicle.status] || {
                bg: "bg-slate-50 border-slate-200",
                text: "text-slate-600",
                dot: "bg-slate-500",
              };
              return (
                <TableRow
                  key={vehicle.vehicleNumber || vehicle.id || vehicle.vehicleNo}
                  className="group cursor-pointer hover:bg-[#fafbfe] transition-colors"
                  onClick={() => onNavigate(vehicle.vehicleNumber || vehicle.vehicleNo)}
                >
                  {/* Vehicle */}
                  <TableCell className="pl-5 py-3.5">
                    <div>
                      <span className="text-sm font-semibold text-[#1d4ed8]">{vehicle.vehicleNumber || vehicle.vehicleNo}</span>
                      <div className="mt-0.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 rounded-sm ${vehicle.vehicleType === "Own" || vehicle.ownership === "Own"
                            ? "border-blue-200 text-blue-600 bg-blue-50/60"
                            : "border-orange-200 text-orange-600 bg-orange-50/60"
                            }`}
                        >
                          {vehicle.vehicleType || vehicle.ownership || "Rented"}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>

                  {/* Driver */}
                  <TableCell className="py-3.5">
                    <div>
                      <p className="text-sm font-medium text-foreground">{vehicle.driverName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" />
                        {vehicle.driverPhone}
                      </p>
                    </div>
                  </TableCell>

                  {/* Shipment */}
                  <TableCell className="py-3.5">
                    <div>
                      <span className="text-sm text-[#1d4ed8] font-medium">{vehicle.shipmentId}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[140px]">
                        {vehicle.dealerName || vehicle.dealer}
                      </p>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3.5">
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

                  {/* Actions */}
                  <TableCell className="pr-5 text-center py-3.5">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(vehicle.vehicleNumber || vehicle.vehicleNo);
                        }}
                        className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-200 gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Tracking
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {safeVehicles.length === 0 && (
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

      {/* Footer */}
      <div className="border-t border-border px-5 py-2.5 flex items-center justify-between bg-[#fafbfc] shrink-0">
        <p className="text-xs text-muted-foreground font-semibold">
          Showing {safeVehicles.length} vehicle{safeVehicles.length !== 1 ? "s" : ""} in fleet control
        </p>
      </div>
    </div>
  );
}
export default TripTable;
