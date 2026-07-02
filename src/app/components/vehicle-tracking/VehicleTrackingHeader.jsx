import { ArrowLeft, Truck, RefreshCw, Check, X } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";

export function VehicleTrackingHeader({
  data,
  ss,
  onDispatch,
  onReturn,
  onCloseShipment,
  isPolling,
  lastPoll,
  onRefresh,
  activeShipment,
}) {
  const navigate = useNavigate();

  const lastPollStr = lastPoll
    ? lastPoll.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="px-6 pt-6 pb-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/trips")}
          className="w-9 h-9 rounded-lg border border-border bg-white flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-foreground tracking-tight flex items-center gap-3">
            Vehicle Tracking
            <span className="text-[#1d4ed8]">— {data.vehicleNumber}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
            Tracking for shipment {data.shipmentId}
            {lastPollStr && (
              <span className="text-[10px] text-muted-foreground/60">
                · polled {lastPollStr}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="gap-2 border-border text-muted-foreground hover:text-foreground h-9 cursor-pointer"
          onClick={onRefresh}
          disabled={isPolling}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? "animate-spin" : ""}`} />
          Refresh
        </Button>

        {/* Dynamic operational button based on database status */}
        {!activeShipment && (
          <Button variant="outline" className="gap-2 h-9 border-border pointer-events-none opacity-50" disabled>
            No Active Trip
          </Button>
        )}

        {activeShipment?.status === "Pending" && (
          <Button
            className="gap-2 h-9 bg-[#1d4ed8] hover:bg-[#1e40af] text-white cursor-pointer shadow-sm"
            onClick={onDispatch}
          >
            <Truck className="w-3.5 h-3.5" />
            Dispatch
          </Button>
        )}

        {/* Delivered but not closed — Close Shipment button */}
        {activeShipment?.status === "Delivered" && (
          <Button
            className="gap-2 h-9 bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-sm"
            onClick={onCloseShipment}
          >
            <X className="w-3.5 h-3.5" />
            Close Shipment
          </Button>
        )}

        {/* Awaiting Closure — disabled button */}
        {activeShipment?.status === "In Transit" && (
          <Button
            variant="outline"
            className="gap-2 h-9 border-amber-300 text-amber-700 bg-amber-50 cursor-not-allowed opacity-70"
            disabled
          >
            <Check className="w-3.5 h-3.5" />
            In Transit
          </Button>
        )}

        {/* Closed but no returnedDate — active arrival button */}
        {activeShipment?.status === "Closed" && !activeShipment?.returnedDate && (
          <Button
            className="gap-2 h-9 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-sm animate-pulse"
            onClick={onReturn}
          >
            <Check className="w-3.5 h-3.5" />
            Mark Arrival (Manual Entry)
          </Button>
        )}

        {/* Closed with returnedDate — fully done */}
        {activeShipment?.status === "Closed" && activeShipment?.returnedDate && (
          <Button
            variant="secondary"
            className="gap-2 h-9 cursor-default pointer-events-none bg-slate-100 text-slate-700 border border-slate-200"
            disabled
          >
            <Check className="w-3.5 h-3.5" />
            Closed — Available
          </Button>
        )}

        <span
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${ss.bg} ${ss.text}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${ss.dot} ${data.status === "In Transit" ? "animate-pulse" : ""}`}
          />
          {data.status}
        </span>
      </div>
    </div>
  );
}

export default VehicleTrackingHeader;
