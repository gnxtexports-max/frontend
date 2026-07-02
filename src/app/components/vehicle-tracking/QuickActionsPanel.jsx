import { Phone, Eye, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";

export function QuickActionsPanel({ data }) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 space-y-4">
      {/* Quick Actions */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-3">
        <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
        <div className="space-y-2">

          <Button
            variant="outline"
            className="w-full justify-start gap-2.5 border-border h-10"
            onClick={() => navigate("/shipments")}
          >
            <Eye className="w-4 h-4 text-violet-500" />
            View Shipment Details
          </Button>
        </div>
      </div>

      {/* Driver Info */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-3">
        <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Driver Info</h3>
        <div className="space-y-2.5">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Name</p>
            <p className="text-sm text-foreground mt-0.5">{data.driverName}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone</p>
            <p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-emerald-500" />
              {data.driverPhone}
            </p>
          </div>
        </div>
      </div>

      {/* Shipment Info */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-3">
        <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Shipment Info</h3>
        <div className="space-y-2.5">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Shipment ID</p>
            <p className="text-sm text-[#1d4ed8] mt-0.5">{data.shipmentId}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dealer</p>
            <p className="text-sm text-foreground mt-0.5">{data.dealerName}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Destination</p>
            <p className="text-sm text-foreground mt-0.5">{data.dealerLocation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickActionsPanel;
