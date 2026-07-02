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
        return (
          <div
            key={i}
            onClick={() => onStatClick(stat.title)}
            className="bg-white border border-border rounded-xl p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold tracking-tight text-foreground mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg} ${stat.border} border`}>
                {IconComponent && <IconComponent className={`w-5 h-5 ${stat.iconColor}`} />}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span className={stat.trendUp ? "text-emerald-600" : "text-amber-600"}>
                  {stat.trend}
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
