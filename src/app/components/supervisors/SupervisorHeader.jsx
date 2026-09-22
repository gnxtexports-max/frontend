import { UserCheck, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";

export function SupervisorHeader({ supervisors = [], onAddSupervisorClick }) {
  const activeCount = supervisors.filter((s) => s.status === "Active").length;
  const totalCount = supervisors.length;

  return (
    <div className="px-6 pt-6 pb-4 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-foreground tracking-tight flex items-center gap-2.5 text-2xl font-bold">
            <UserCheck className="w-6 h-6 text-[#1d4ed8]" />
            Supervisor Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage all supervisors and their employee assignments
          </p>
        </div>
        <Button
          onClick={onAddSupervisorClick}
          className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white gap-2 h-9 px-4 text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Supervisor
        </Button>
      </div>

      {/* Summary Pills */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-xs shadow-xs">
          <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Total Supervisors:</span>
          <span className="text-foreground font-semibold">{totalCount}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-xs shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-muted-foreground">Active:</span>
          <span className="text-foreground font-semibold">{activeCount}</span>
        </div>
      </div>
    </div>
  );
}

export default SupervisorHeader;
