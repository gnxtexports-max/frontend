import { format } from "date-fns";
import {
  ArrowLeft,
  Search,
  History,
  FileCheck,
  Eye,
  Package,
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  Phone,
  Truck,
  MapPin,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { cn } from "../ui/utils";

function formatDate(d) {
  if (!d) return "—";
  try { return format(new Date(d), "dd MMM yyyy"); }
  catch { return "—"; }
}

function formatTime(d) {
  if (!d) return "—";
  try { return format(new Date(d), "hh:mm a"); }
  catch { return "—"; }
}

function kg(val) {
  if (val == null || val === 0) return "—";
  return `${val} kg`;
}

export function StatDetailView({
  activeStatView,
  onBack,
  tableData,
  searchQuery,
  setSearchQuery,
  podFilter,
  setPodFilter,
  dateFilter,
  setDateFilter,
  showHistory,
  setShowHistory,
  onView,
}) {
  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{activeStatView}</h1>
          <p className="text-sm text-muted-foreground mt-1">Detailed view of all {activeStatView.toLowerCase()}.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by Shipment ID, Driver, Vehicle..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 bg-white border-border" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-[#fafbfc]">
                {activeStatView === "Active Shipments" && (
                  <>
                    <TableHead className="pl-5 w-[150px]">Shipment ID</TableHead>
                    <TableHead className="w-[200px]">Dealer & Location</TableHead>
                    <TableHead className="w-[150px]">Weight</TableHead>
                    <TableHead className="w-[160px]">Driver Info</TableHead>
                    <TableHead className="w-[160px]">Vehicle Info</TableHead>
                    <TableHead className="w-[110px]">Date</TableHead>
                    <TableHead className="w-[110px]">POD</TableHead>
                    <TableHead className="w-[60px] pr-5 text-center">View</TableHead>
                  </>
                )}
                {activeStatView === "Pending Dispatch" && (
                  <>
                    <TableHead className="pl-5">Shipment ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Planned Vehicle</TableHead>
                    <TableHead className="pr-5">Dispatch Status</TableHead>
                  </>
                )}
                {activeStatView === "Cancelled Invoices" && (
                  <>
                    <TableHead className="pl-5">Shipment ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="pr-5">Status</TableHead>
                  </>
                )}
                {activeStatView === "Deliveries Today" && (
                  <>
                    <TableHead className="pl-5">Shipment ID</TableHead>
                    <TableHead>Dealer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Delivered Time</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="pr-5">POD Received</TableHead>
                  </>
                )}
                {!["Active Shipments", "Pending Dispatch", "Cancelled Invoices", "Deliveries Today"].includes(activeStatView) && (
                  <>
                    <TableHead className="pl-5">Shipment ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-5">Info</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="p-0 border-none bg-slate-50/50">
                    <div className="w-full flex flex-col items-center justify-center py-10 px-6">
                      <h4 className="text-sm font-semibold text-foreground mb-1">No Data Available</h4>
                      <p className="text-sm text-muted-foreground max-w-sm text-center">
                        Please adjust your filters or select a different stat card above.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((item, idx) => {
                  const s = item.originalData;
                  if (activeStatView === "Cancelled Invoices") {
                    return (
                      <TableRow key={idx} className="group cursor-default">
                        <TableCell className="pl-5"><span className="font-medium text-[#1d4ed8]">{item.id || "—"}</span></TableCell>
                        <TableCell><span className="text-xs text-slate-600">{formatDate(item.originalDate)}</span></TableCell>
                        <TableCell className="text-sm font-semibold text-slate-800">{item.customer || "—"}</TableCell>
                        <TableCell className="text-sm text-slate-600">{item.location || "—"}</TableCell>
                        <TableCell className="pr-5"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700 border border-red-200">Cancelled</span></TableCell>
                      </TableRow>
                    );
                  }
                  if (activeStatView === "Pending Dispatch") {
                    return (
                      <TableRow key={idx} className="group cursor-default">
                        <TableCell className="pl-5"><span className="font-medium text-[#1d4ed8]">{item.id || "—"}</span></TableCell>
                        <TableCell><span className="text-xs text-slate-600">{formatDate(item.originalDate)}</span></TableCell>
                        <TableCell className="text-sm font-semibold text-slate-800">{item.customer || item.destination || "—"}</TableCell>
                        <TableCell className="text-sm text-slate-600">{item.location || s?.destinations?.[0]?.deliveryLocation || "—"}</TableCell>
                        <TableCell><span className="text-sm text-foreground">{kg(s?.totalWeightKg)}</span></TableCell>
                        <TableCell><span className="text-sm text-foreground">{s?.totalQuantity ?? 0}</span></TableCell>
                        <TableCell><span className="text-sm text-foreground">{item.vehicle || "—"}</span></TableCell>
                        <TableCell className="pr-5"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-200">Pending</span></TableCell>
                      </TableRow>
                    );
                  }
                  if (activeStatView === "Active Shipments") {
                    const weight = s?.totalWeightKg ? `${s.totalWeightKg} kg` : "—";
                    const phone = s?.driverPhone || "—";
                    const ownerType = s?.vehicleId?.ownership === "Company" ? "Own" : s?.vehicleId?.type === "Company" ? "Own" : "Rented";
                    return (
                      <TableRow key={idx} className="group cursor-default">
                        <TableCell className="pl-5"><span className="font-medium text-[#1d4ed8]">{item.id || "—"}</span></TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground">{item.destination || "—"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.location || s?.destinations?.[0]?.deliveryLocation || ""}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm text-foreground">{weight}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground">{item.driver || "—"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3" />{phone}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-foreground">{item.vehicle || "—"}</p>
                            <Badge variant="outline" className="mt-0.5 text-[10px] px-1.5 py-0 rounded-sm border-blue-200 text-blue-600 bg-blue-50/60">{ownerType}</Badge>
                          </div>
                        </TableCell>
                        <TableCell><span className="text-sm text-muted-foreground">{formatDate(item.originalDate)}</span></TableCell>
                        <TableCell>
                          {item.podConfig ? (
                            <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border ${item.podConfig.className}`}>
                              {item.podConfig.icon ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {item.podConfig.label}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                              <Clock className="w-3 h-3" />Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="pr-5 text-center">
                          <Button variant="ghost" size="icon" onClick={() => onView && onView(item)} className="w-8 h-8 text-muted-foreground hover:text-foreground">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  if (activeStatView === "Deliveries Today") {
                    return (
                      <TableRow key={idx} className="group cursor-default">
                        <TableCell className="pl-5"><span className="font-medium text-[#1d4ed8]">{item.id || "—"}</span></TableCell>
                        <TableCell className="text-sm font-semibold text-slate-800">{item.customer || item.destination || "—"}</TableCell>
                        <TableCell className="text-sm text-slate-600">{item.location || s?.destinations?.[0]?.deliveryLocation || "—"}</TableCell>
                        <TableCell><span className="text-sm text-muted-foreground">{formatTime(s?.deliveryDate)}</span></TableCell>
                        <TableCell><p className="text-sm text-foreground">{item.driver || "—"}</p></TableCell>
                        <TableCell><span className="text-sm text-foreground">{item.vehicle || "—"}</span></TableCell>
                        <TableCell className="pr-5">
                          {item.podConfig ? (
                            <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border ${item.podConfig.className}`}>
                              {item.podConfig.icon ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {item.podConfig.label}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                              <Clock className="w-3 h-3" />Pending
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  // Fallback for other stat views
                  return (
                    <TableRow key={idx} className="group cursor-default">
                      <TableCell className="pl-5"><span className="font-medium text-[#1d4ed8]">{item.id || "—"}</span></TableCell>
                      <TableCell><p className="text-sm text-foreground">{item.driver || item.customer || "—"}</p></TableCell>
                      <TableCell className="text-sm text-slate-600">{item.location || item.destination || "—"}</TableCell>
                      <TableCell><span className="text-sm text-muted-foreground">{formatDate(item.originalDate)}</span></TableCell>
                      <TableCell><span className="text-sm text-foreground">{item.vehicle || "—"}</span></TableCell>
                      <TableCell><span className="text-sm text-foreground">{item.status || "—"}</span></TableCell>
                      <TableCell className="pr-5"><span className="text-sm text-muted-foreground">—</span></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
export default StatDetailView;
