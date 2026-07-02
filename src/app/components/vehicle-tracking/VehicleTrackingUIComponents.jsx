/* ── Shared UI primitives for VehicleTrackingPage ── */

export function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-[#eef2ff] border border-[#c7d7fe] flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm text-foreground">{title}</h3>
    </div>
  );
}

export function KpiCard({ icon, label, value }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#f0f4ff] border border-[#dbe4ff] flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg text-foreground tabular-nums">{value}</p>
    </div>
  );
}

export function RouteInfoCell({ label, value, highlight }) {
  const colorMap = {
    emerald: "text-emerald-600",
    amber:   "text-amber-600",
    red:     "text-red-600",
  };
  return (
    <div className="px-4 py-3.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm mt-1 tabular-nums ${highlight ? colorMap[highlight] : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
