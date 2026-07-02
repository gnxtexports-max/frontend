import { Package, Building2, MapPin, Calendar, Clock, Hash, Weight, Navigation } from "lucide-react";
import { SectionLabel, OverviewCell } from "../ui/ShipmentUIComponents";

export function ShipmentOverview({ shipment, detail, totalQty, totalWt }) {
  // For multi-destination shipments, show all destinations
  const destinations = shipment?.destinations ?? [];

  // Deduplicate customer names and delivery locations
  const uniqueCustomers = [...new Set(destinations.map((d) => d.customerName).filter(Boolean))];
  const uniqueLocations = [...new Set(destinations.map((d) => d.deliveryLocation || d.location).filter(Boolean))];

  const formatDateTime = (d) =>
    d ? new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
      : "—";

  return (
    <div>
      <SectionLabel icon={<Package className="w-4 h-4" />} title="Shipment Overview" />
      <div className="mt-3 bg-white border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-x divide-border">
          <OverviewCell label="Customer Name" icon={<Building2 className="w-3.5 h-3.5" />}>
            {uniqueCustomers.length > 1 ? (
              <div className="flex flex-wrap gap-1 mt-1 max-h-[80px] overflow-y-auto pr-1">
                {uniqueCustomers.map((cust, idx) => (
                  <span key={idx} className="bg-blue-50 text-[#1d4ed8] text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200" title={cust}>
                    {cust}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground font-semibold truncate mt-0.5">
                {uniqueCustomers[0] || shipment.dealerName || "—"}
              </p>
            )}
          </OverviewCell>
          <OverviewCell label="Dealer Location" icon={<MapPin className="w-3.5 h-3.5" />}>
            {uniqueLocations.length > 1 ? (
              <div className="flex flex-wrap gap-1 mt-1 max-h-[80px] overflow-y-auto pr-1">
                {uniqueLocations.map((loc, idx) => (
                  <span key={idx} className="bg-slate-50 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200" title={loc}>
                    {loc}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground font-semibold truncate mt-0.5">
                {uniqueLocations[0] || shipment.dealerLocation || "—"}
              </p>
            )}
          </OverviewCell>
          <OverviewCell label="Dispatch Date"   value={detail.dispatchDate}        icon={<Calendar className="w-3.5 h-3.5" />} />
        </div>
        <div className="border-t border-border grid grid-cols-3 divide-x divide-border">
          <OverviewCell label="Total Quantity" value={`${totalQty} units`}         icon={<Hash className="w-3.5 h-3.5" />} />
          <OverviewCell label="Total Weight"   value={`${totalWt} kg`}             icon={<Weight className="w-3.5 h-3.5" />} />
          <OverviewCell label="Destinations"   value={`${destinations.length}`}    icon={<Navigation className="w-3.5 h-3.5" />} />
        </div>
        <div className="border-t border-border grid grid-cols-1 sm:grid-cols-2 divide-x divide-border">
          <OverviewCell label="Created Date"   value={formatDateTime(shipment?.createdAt)}  icon={<Calendar className="w-3.5 h-3.5" />} />
          <OverviewCell label="Delivery Date"  value={formatDateTime(shipment?.deliveryDate)} icon={<Clock className="w-3.5 h-3.5" />} />
        </div>
      </div>
    </div>
  );
}

export default ShipmentOverview;
