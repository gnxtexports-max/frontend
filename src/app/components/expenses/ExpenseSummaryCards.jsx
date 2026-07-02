import { Wallet, Fuel, CircleDollarSign, Wrench, MoreHorizontal } from "lucide-react";

function SummaryCard({ icon, label, amount, accent }) {
  const bgMap = {
    blue: "bg-blue-50/60 border-blue-100",
    orange: "bg-orange-50/60 border-orange-100",
    purple: "bg-violet-50/60 border-violet-100",
    green: "bg-emerald-50/60 border-emerald-100",
    gray: "bg-gray-50/60 border-gray-100",
  };

  return (
    <div className={`rounded-xl border p-4 ${bgMap[accent]} transition-colors`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-lg text-foreground tabular-nums tracking-tight">
        ₹{amount.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

export function ExpenseSummaryCards({
  totalExpenses,
  fuelCost,
  tollCharges,
  maintenance,
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
        icon={<Fuel className="w-4 h-4 text-[#ea580c]" />}
        label="Fuel Cost"
        amount={fuelCost}
        accent="orange"
      />
      <SummaryCard
        icon={<CircleDollarSign className="w-4 h-4 text-[#7c3aed]" />}
        label="Toll Charges"
        amount={tollCharges}
        accent="purple"
      />
      <SummaryCard
        icon={<Wrench className="w-4 h-4 text-[#059669]" />}
        label="Maintenance"
        amount={maintenance}
        accent="green"
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
