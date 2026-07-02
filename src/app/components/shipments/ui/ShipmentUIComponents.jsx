/* ── Shared small UI primitives used across Create & View sheets ── */

export function SectionHeader({ icon, title, description, number }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-[#eef2ff] border border-[#c7d7fe] flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs text-[#4338ca]">{number}</span>
      </div>
      <div>
        <h3 className="text-sm text-foreground flex items-center gap-2 font-medium">
          {icon}
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export function SectionLabel({ icon, title }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-[#eef2ff] border border-[#c7d7fe] flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm text-foreground">{title}</h3>
    </div>
  );
}

export function SummaryMetric({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-lg text-foreground tracking-tight font-semibold">{value}</p>
      </div>
    </div>
  );
}

export function ValidationWarning({ message }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
      <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span className="text-xs text-amber-700">{message}</span>
    </div>
  );
}

export function OverviewCell({ label, value, icon, children }) {
  return (
    <div className="px-4 py-3.5 space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      {children ?? <p className="text-sm text-foreground truncate">{value}</p>}
    </div>
  );
}

export function TrackingRow({ label, value, highlight }) {
  return (
    <div className="px-4 py-2.5 flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs ${highlight ? "text-[#1d4ed8]" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

export function DetailField({ label, value, children }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      {children ?? <p className="text-sm text-foreground">{value}</p>}
    </div>
  );
}

export function SummaryPill({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className="text-xs text-foreground">{value}</span>
    </div>
  );
}
