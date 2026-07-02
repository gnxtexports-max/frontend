import { Truck, MapPin, AlertTriangle, Package } from "lucide-react";
import { Button } from "../ui/button";

export function LiveShipmentsTable({ currentShipments = [] }) {
  return (
    <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between bg-white">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Live Shipments</h3>
          <p className="text-sm text-muted-foreground">Real-time tracking of ongoing deliveries</p>
        </div>
        <Button variant="ghost" className="text-[#1d4ed8] hover:bg-blue-50">
          View Map <MapPin className="w-4 h-4 ml-2" />
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-[#fafbfc] uppercase border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium">Shipment ID</th>
              <th className="px-6 py-4 font-medium">Vehicle / Driver</th>
              <th className="px-6 py-4 font-medium">Destination</th>
              <th className="px-6 py-4 font-medium">Status & ETA</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {currentShipments.map((shipment, i) => (
              <tr key={i} className="hover:bg-[#fafbfc] transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-foreground">{shipment.id}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{shipment.items}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{shipment.vehicle}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    {shipment.driver}
                  </div>
                </td>
                <td className="px-6 py-4 text-foreground font-medium">{shipment.destination}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5 w-48">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`font-semibold flex items-center gap-1.5 ${
                          shipment.status === "Delayed"
                            ? "text-red-600"
                            : shipment.status === "Unloading"
                              ? "text-blue-600"
                              : "text-emerald-600"
                        }`}
                      >
                        {shipment.status === "Delayed" && <AlertTriangle className="w-3.5 h-3.5" />}
                        {shipment.status === "Unloading" && <Package className="w-3.5 h-3.5" />}
                        {shipment.status === "In Transit" && <Truck className="w-3.5 h-3.5" />}
                        {shipment.status}
                      </span>
                      <span className="text-muted-foreground">{shipment.eta}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          shipment.status === "Delayed" ? "bg-red-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${shipment.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                    Track
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default LiveShipmentsTable;
