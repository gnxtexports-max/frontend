import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function DashboardChart({ weeklyData = [] }) {
  return (
    <div className="xl:col-span-2 bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight">Dispatch vs Delivery Volume</h3>
        <p className="text-sm text-muted-foreground">Shipment quantities over the last 7 days</p>
      </div>
      <div className="h-[300px] w-full min-h-[300px] min-w-[300px] flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={300}>
          <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs key="chart-defs">
              <linearGradient id="colorDispatches" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDeliveries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid key="chart-grid" strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              key="chart-xaxis"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              dy={10}
            />
            <YAxis
              key="chart-yaxis"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
            />
            <Tooltip
              key="chart-tooltip"
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Legend key="chart-legend" verticalAlign="top" height={36} iconType="circle" />
            <Area
              key="chart-area-dispatches"
              type="monotone"
              dataKey="dispatches"
              name="Dispatches"
              stroke="#1d4ed8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDispatches)"
            />
            <Area
              key="chart-area-deliveries"
              type="monotone"
              dataKey="deliveries"
              name="Deliveries"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDeliveries)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
export default DashboardChart;
