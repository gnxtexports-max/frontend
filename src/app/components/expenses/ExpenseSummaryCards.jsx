import { Wallet, Fuel, Truck, Wrench, MoreHorizontal } from "lucide-react";

function SummaryCard({ icon, label, amount, accent }) {
  const bgMap = {
    blue: "bg-blue-50/60 border-blue-100",
    indigo: "bg-indigo-50/60 border-indigo-100",
    purple: "bg-purple-50/60 border-purple-100",
    orange: "bg-orange-50/60 border-orange-100",
    gray: "bg-gray-50/60 border-gray-100",
  };

  return (
    <div className={`rounded-xl border p-4 ${bgMap[accent] || bgMap.gray} transition-colors`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <p className="text-lg text-foreground tabular-nums tracking-tight font-bold">
        ₹{amount.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

export function ExpenseSummaryCards({
  totalExpenses,
  dispatchTotal = 0,
  maintenanceTotal = 0,
  fuelCost,
  otherExpenses,
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <SummaryCard
        icon={<Wallet className="w-4 h-4 text-[#1d4ed8]" />}
        label="Total Expenses"
        amount={totalExpenses}
        accent="blue"
      />
      <SummaryCard
        icon={<Truck className="w-4 h-4 text-[#2563eb]" />}
        label="Dispatch Expenses"
        amount={dispatchTotal}
        accent="indigo"
      />
      <SummaryCard
        icon={<Wrench className="w-4 h-4 text-[#9333ea]" />}
        label="Maintenance Expenses"
        amount={maintenanceTotal}
        accent="purple"
      />
      <SummaryCard
        icon={<Fuel className="w-4 h-4 text-[#ea580c]" />}
        label="Fuel Cost"
        amount={fuelCost}
        accent="orange"
      />
      <SummaryCard
        icon={<MoreHorizontal className="w-4 h-4 text-[#6b7280]" />}
        label="Other Expenses"
        amount={otherExpenses}
        accent="gray"
      />
    </div>
  );
}
export default ExpenseSummaryCards;
