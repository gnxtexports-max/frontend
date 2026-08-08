import { ChevronRight, Truck, MapPin, Clock, CheckCircle2, FileWarning, XCircle } from "lucide-react";

// Map iconName strings to actual icon components
const ICON_MAP = {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  FileWarning,
  XCircle,
};

export function DashboardStatsGrid({ onStatClick, stats = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {stats.map((stat, i) => {
        const IconComponent = ICON_MAP[stat.iconName];
        const isInTransitCard = stat.title === "In Transit Shipments" || stat.inTransitInvoices !== undefined;
        const isPendingDispatchCard = stat.title === "Pending Invoices for Dispatch" || stat.pendingInvoices !== undefined;
        const isCancelledCard = stat.title === "Cancelled Invoices";
        const isDeliveriesTodayCard = stat.title === "Deliveries Today" || stat.deliveredInvoices !== undefined;

        return (
          <div
            key={i}
            onClick={() => onStatClick(stat.title)}
            className="bg-white border border-border rounded-xl p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                    {stat.title}
                  </p>
                  {isCancelledCard && (
                    <div className="mt-2">
                      <p className="text-3xl font-bold tracking-tight text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-xs text-red-600 font-medium mt-1">invoices</p>
                    </div>
                  )}
                  {!isInTransitCard && !isPendingDispatchCard && !isCancelledCard && !isDeliveriesTodayCard && (
                    <p className="text-3xl font-bold tracking-tight text-foreground mt-2">
                      {stat.value}
                    </p>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg} ${stat.border} border shrink-0`}>
                  {IconComponent && <IconComponent className={`w-5 h-5 ${stat.iconColor}`} />}
                </div>
              </div>

              {/* Sub-metrics layout for In Transit Shipments */}
              {isInTransitCard && (
                <div className="mt-3.5 space-y-1.5 text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans font-medium">In Transit Invoices</span>
                    <span className="font-bold text-slate-900 text-sm">: {stat.inTransitInvoices ?? stat.value ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans font-medium">In Transit Weight</span>
                    <span className="font-bold text-slate-900 text-sm">: {stat.inTransitWeightFormatted || (stat.inTransitWeight ? `${stat.inTransitWeight} kg` : "0 kg")}</span>
                  </div>
                </div>
              )}

              {/* Sub-metrics layout for Pending Invoices for Dispatch */}
              {isPendingDispatchCard && (
                <div className="mt-3.5 space-y-1.5 text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans font-medium">Pending Invoices</span>
                    <span className="font-bold text-slate-900 text-sm">: {stat.pendingInvoices ?? stat.value ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans font-medium">Pending Weight</span>
                    <span className="font-bold text-slate-900 text-sm">: {stat.pendingWeightFormatted || (stat.pendingWeight ? `${stat.pendingWeight} kg` : "0 kg")}</span>
                  </div>
                </div>
              )}

              {/* Sub-metrics layout for Deliveries Today */}
              {isDeliveriesTodayCard && (
                <div className="mt-3.5 space-y-1.5 text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans font-medium">Delivered Invoices</span>
                    <span className="font-bold text-slate-900 text-sm">: {stat.deliveredInvoices ?? stat.value ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans font-medium">Delivered Weight</span>
                    <span className="font-bold text-slate-900 text-sm">: {stat.deliveredWeightFormatted || (stat.deliveredWeight ? `${stat.deliveredWeight} kg` : "0 kg")}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span className={stat.trendUp ? "text-emerald-600" : "text-amber-600"}>
                  {stat.trend || "View Details"}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default DashboardStatsGrid;
