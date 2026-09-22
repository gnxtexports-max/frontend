import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Edit2,
  Trash2,
  Phone,
  Mail,
  UserCheck,
  Calendar,
  Sparkles,
} from "lucide-react";

export function SupervisorTable({
  supervisors,
  loading,
  onEditSupervisor,
  onDeleteSupervisor,
}) {
  if (loading) {
    return (
      <div className="px-6 pb-6 flex-1 min-h-0 overflow-auto">
        <div className="bg-white border border-border rounded-xl overflow-hidden p-12 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading supervisors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 flex-1 min-h-0 overflow-auto">
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f8f9fb] hover:bg-[#f8f9fb]">
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3 pl-5">
                Supervisor Name
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3">
                Employee ID
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3">
                Phone Number
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3">
                Email
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3">
                Status
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3">
                Created
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3 pr-5 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supervisors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-16 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <UserCheck className="w-8 h-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No supervisors found</p>
                    <p className="text-xs text-muted-foreground/70">
                      Add a new supervisor or adjust your filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              supervisors.map((supervisor) => {
                const initials = (supervisor.name || "S")
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                const createdAtStr = supervisor.createdAt
                  ? new Date(supervisor.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";

                return (
                  <TableRow
                    key={supervisor._id}
                    className="group hover:bg-[#f8f9fb]/60 transition-colors"
                  >
                    {/* Supervisor Name */}
                    <TableCell className="py-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[#1d4ed8]">
                            {initials}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {supervisor.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Designation: Supervisor
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Employee ID */}
                    <TableCell className="py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100 font-mono text-xs font-medium">
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        {supervisor.employeeId || "—"}
                      </span>
                    </TableCell>

                    {/* Phone Number */}
                    <TableCell className="py-3.5">
                      {supervisor.phone ? (
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>{supervisor.phone}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Email */}
                    <TableCell className="py-3.5">
                      {supervisor.email ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[150px]">{supervisor.email}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3.5">
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                          supervisor.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${
                            supervisor.status === "Active"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />
                        {supervisor.status || "Active"}
                      </Badge>
                    </TableCell>

                    {/* Created Date */}
                    <TableCell className="py-3.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {createdAtStr}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditSupervisor(supervisor)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-lg"
                          title="Edit Supervisor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteSupervisor(supervisor._id)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          title="Delete Supervisor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default SupervisorTable;
