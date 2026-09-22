import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from "recharts";
import { Filter, Loader2, X, CalendarDays } from "lucide-react";
import { Button } from "../ui/button";

export function DashboardChart({
  weeklyData = [],
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  onApply,
  onReset,
  loading = false,
}) {
  const rangeTotals = weeklyData.reduce(
    (acc, curr) => {
      acc.dispatchedInvoices += curr.dispatchedInvoices || 0;
      acc.pendingDispatches += curr.pendingDispatches || 0;
      acc.totalInvoices += curr.totalInvoices || 0;
      acc.dispatchedWeightKg += curr.dispatchedWeightKg || 0;
      return acc;
    },
    { dispatchedInvoices: 0, pendingDispatches: 0, totalInvoices: 0, dispatchedWeightKg: 0 }
  );

  const formattedWeight =
    rangeTotals.dispatchedWeightKg >= 1000
      ? `${(rangeTotals.dispatchedWeightKg / 1000).toFixed(2)} Ton`
      : `${rangeTotals.dispatchedWeightKg.toLocaleString("en-IN")} kg`;

  return (
    <div className="w-full bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
      {/* Header & Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            Invoice & Dispatch Volume Summary
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daily dispatched vs pending invoice volumes
          </p>
        </div>

        {/* Unified Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-50/80 p-1.5 rounded-lg border border-border">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-border text-xs">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">From:</span>
            <input
              type="date"
              value={fromDate || ""}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-foreground text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-border text-xs">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">To:</span>
            <input
              type="date"
              value={toDate || ""}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-foreground text-xs"
            />
          </div>

          <Button
            size="sm"
            onClick={onApply}
            disabled={loading}
            className="h-8 px-3 text-xs bg-[#1d4ed8] hover:bg-blue-800 text-white font-medium shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <Filter className="w-3.5 h-3.5 mr-1" />
            )}
            Apply
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Grid: Chart on Left, Metric Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch w-full">
        {/* Bar Chart Container */}
        <div className="lg:col-span-3 h-[340px] w-full min-h-[340px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={340}>
            <BarChart data={weeklyData} margin={{ top: 24, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              />
              <Bar
                dataKey="dispatchedInvoices"
                name="Dispatched Invoices"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                barSize={22}
              >
                <LabelList dataKey="dispatchedInvoices" position="top" fill="#e11d48" fontSize={11} fontWeight="bold" dy={-6} />
              </Bar>
              <Bar
                dataKey="pendingDispatches"
                name="Pending Dispatches"
                fill="#f59e0b"
                radius={[6, 6, 0, 0]}
                barSize={22}
              >
                <LabelList dataKey="pendingDispatches" position="top" fill="#d97706" fontSize={11} fontWeight="bold" dy={-6} />
              </Bar>
              <Bar
                dataKey="totalInvoices"
                name="Total Invoices"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                barSize={22}
              >
                <LabelList dataKey="totalInvoices" position="top" fill="#2563eb" fontSize={11} fontWeight="bold" dy={-6} />
              </Bar>
              <Bar
                dataKey="dispatchedWeightKg"
                name="Dispatched Weight (kg)"
                fill="#8b5cf6"
                radius={[6, 6, 0, 0]}
                barSize={22}
              >
                <LabelList
                  dataKey="dispatchedWeightKg"
                  position="top"
                  fill="#7c3aed"
                  fontSize={10}
                  fontWeight="bold"
                  dy={-6}
                  formatter={(val) => (val > 0 ? `${val}kg` : "0")}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right Side Metrics & Summary Box */}
        <div className="lg:col-span-1 bg-slate-50/80 border border-slate-200/80 rounded-xl p-4.5 flex flex-col justify-center space-y-4 shadow-2xs">
          <div className="pb-2 border-b border-slate-200/60">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Range Summary & Legend
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Aggregated totals for selected range</p>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {/* Metric 1 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] shrink-0" />
                <span className="font-semibold text-slate-700 truncate">Dispatched Invoices</span>
              </div>
              <span className="font-bold text-slate-900 text-sm pl-2 shrink-0">: {rangeTotals.dispatchedInvoices}</span>
            </div>

            {/* Metric 2 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0" />
                <span className="font-semibold text-slate-700 truncate">Pending Dispatches</span>
              </div>
              <span className="font-bold text-slate-900 text-sm pl-2 shrink-0">: {rangeTotals.pendingDispatches}</span>
            </div>

            {/* Metric 3: Total Range Invoices */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/60 border border-blue-200/80 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shrink-0" />
                <span className="font-bold text-slate-800 truncate">Total Range Invoices</span>
              </div>
              <span className="font-extrabold text-[#1d4ed8] text-base pl-2 shrink-0">: {rangeTotals.totalInvoices}</span>
            </div>

            {/* Metric 4 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] shrink-0" />
                <span className="font-semibold text-slate-700 truncate">Dispatched Weight</span>
              </div>
              <span className="font-bold text-slate-900 text-sm pl-2 shrink-0">: {formattedWeight}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DashboardChart;
