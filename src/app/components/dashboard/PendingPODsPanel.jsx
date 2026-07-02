import { useNavigate } from "react-router";
import { Truck, FileSpreadsheet, PlusCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "../../context/AuthContext";

export function PendingPODsPanel() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const steps = [
    {
      num: "01",
      title: "Register Fleet Assets",
      desc: "Configure vehicles and assign drivers in fleet manager.",
      icon: Truck,
      bg: "bg-blue-50/60 border-blue-100/60 text-blue-600",
    },
    {
      num: "02",
      title: "Upload & Verify Invoices",
      desc: "Upload Excel billing sheets to auto-map plant details.",
      icon: FileSpreadsheet,
      bg: "bg-amber-50/60 border-amber-100/60 text-amber-600",
    },
    {
      num: "03",
      title: "Combine LRs & Build Shipment",
      desc: "Group multiple plants under a single destination.",
      icon: PlusCircle,
      bg: "bg-violet-50/60 border-violet-100/60 text-violet-600",
    },
    {
      num: "04",
      title: "Dispatch & Track Delivery",
      desc: "Dispatch trip, track progress, and collect signed PODs.",
      icon: CheckCircle2,
      bg: "bg-emerald-50/60 border-emerald-100/60 text-emerald-700",
    },
  ];

  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-sm flex flex-col h-full justify-between hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-bold tracking-tight text-foreground">Shipment Operational Flow</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Quick step-by-step dispatch walkthrough</p>
      </div>

      {/* Visual Checklist */}
      <div className="space-y-2.5 flex-1 flex flex-col justify-center">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="flex gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/20 hover:bg-slate-50/60 transition-all duration-150 group"
            >
              {/* Left Badge with Step & Icon */}
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${step.bg} shadow-sm group-hover:scale-105 transition-transform duration-150`}>
                  <Icon className="w-4 h-4" />
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-[1.2px] h-4 bg-slate-200/80 mt-1 shrink-0 border-dashed" />
                )}
              </div>

              {/* Text details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Step {step.num}</span>
                </div>
                <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-[#1d4ed8] transition-colors">
                  {step.title}
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 truncate">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      {hasPermission("Shipments", "create") && (
        <Button
          onClick={() => navigate("/shipments", { state: { openCreate: true } })}
          className="w-full mt-4 bg-[#1d4ed8] hover:bg-[#1e40af] text-white shadow-sm font-medium flex items-center justify-center gap-1.5 h-9 group transition-all duration-200 rounded-lg border-none cursor-pointer text-xs"
        >
          <span>Create New Shipment</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      )}
    </div>
  );
}

export default PendingPODsPanel;
