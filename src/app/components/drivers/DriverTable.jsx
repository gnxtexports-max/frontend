import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import {
  Eye,
  Edit2,
  Truck,
  PhoneIcon,
  Users,
} from "lucide-react";
import {
  tripStatusStyles,
  driverTypeBadgeStyles,
} from "./utils/driverStyles";

export function DriverTable({
  drivers,
  totalDrivers,
  loading,
  onViewDriver,
  onEditDriver,
  onDeleteDriver,
}) {
  if (loading) {
    return (
      <div className="px-6 pb-6 flex-1 min-h-0 overflow-auto">
        <div className="bg-white border border-border rounded-xl overflow-hidden p-8 text-center">
          <p className="text-muted-foreground">Loading drivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 flex-1 min-h-0 overflow-auto">
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f8f9fb] hover:bg-[#f8f9fb]">
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3 pl-5">
                Driver Name
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3">
                Driver Type
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3">
                Phone Number
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3">
                License
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3">
                Assigned Vehicle
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3">
                Trip Status
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-3 pr-5 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-16 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-8 h-8 text-muted-foreground/40" />
                    <p className="text-sm">No drivers found</p>
                    <p className="text- xs text-muted-foreground/70">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => {
                const statusStyle = tripStatusStyles[driver.tripStatus] || {
                  bg: "bg-slate-50 border-slate-200",
                  text: "text-slate-600",
                  dot: "bg-slate-400",
                };
                const typeStyle = driverTypeBadgeStyles[driver.driverType] || "bg-slate-50 text-slate-700 border-slate-200";

                return (
                  <TableRow
                    key={driver._id}
                    className="group hover:bg-[#f8f9fb]/60 transition-colors"
                  >
                    {/* Driver Name */}
                    <TableCell className="py-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#7c3aed] flex items-center justify-center shrink-0">
                          <span className="text-[11px] text-white font-semibold">
                            {driver.name
                              .split(" ")
                              .slice(0, 2)
                              .map((w) => w[0])
                              .join("")}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-foreground font-medium">
                            {driver.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Age: {driver.age}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Driver Type */}
                    <TableCell className="py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${typeStyle}`}
                      >
                        {driver.driverType}
                      </span>
                    </TableCell>

                    {/* Phone Number */}
                    <TableCell className="py-3.5">
                      <a
                        href={`tel:${driver.phone.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-[#1d4ed8] transition-colors"
                      >
                        <PhoneIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        {driver.phone}
                      </a>
                    </TableCell>

                    {/* License */}
                    <TableCell className="py-3.5">
                      <p className="text-sm text-foreground">
                        {driver.licenseNumber}
                      </p>
                    </TableCell>

                    {/* Assigned Vehicle */}
                    <TableCell className="py-3.5">
                      {driver.assignedVehicle ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            <Truck className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm text-foreground">
                              {driver.assignedVehicle}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">
                          —
                        </span>
                      )}
                    </TableCell>

                    {/* Trip Status */}
                    <TableCell className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        {statusStyle.dot && (
                          <span className="relative flex h-2 w-2">
                            {driver.tripStatus === "Driving" && (
                              <span
                                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusStyle.dot}`}
                              />
                            )}
                            <span
                              className={`relative inline-flex rounded-full h-2 w-2 ${statusStyle.dot}`}
                            />
                          </span>
                        )}
                        {driver.tripStatus}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs text-muted-foreground hover:text-[#1d4ed8] hover:bg-[#1d4ed8]/5 gap-1.5"
                          onClick={() => onViewDriver(driver)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs text-muted-foreground hover:text-blue-600 hover:bg-blue-50 gap-1.5"
                          onClick={() => onEditDriver(driver)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-[#f8f9fb]/50 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {drivers.length} of {totalDrivers} drivers
          </p>
        </div>
      </div>
    </div>
  );
}

export default DriverTable;