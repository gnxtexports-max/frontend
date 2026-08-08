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

function InvoicesDropdownCell({ invoices = [] }) {
  const count = invoices.length;
  if (count === 0) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/70 transition-colors cursor-pointer">
          <span>▼ {count} {count === 1 ? "Invoice" : "Invoices"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 shadow-md rounded-lg bg-white border border-border" align="start">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 pb-1 border-b border-border">
          Invoice Numbers ({count})
        </p>
        <ul className="max-h-40 overflow-y-auto space-y-1 text-xs text-slate-800 font-mono">
          {invoices.map((inv, i) => (
            <li key={i} className="py-0.5 px-1.5 rounded hover:bg-slate-100 flex items-center justify-between">
              <span>{inv}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
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
    <div className="p-6 md:p-8 w-full space-y-6 h-full flex flex-col">
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
        <div className="relative flex-1 min-w-[280px] max-w-lg w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by Shipment ID, Driver, Vehicle, Customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 bg-white border-border" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex-1 overflow-hidden flex flex-col w-full">
        <div className="flex-1 overflow-x-auto overflow-y-auto w-full">
          <Table className="w-full min-w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-[#fafbfc]">
                {(activeStatView === "In Transit Shipments" || activeStatView === "Active Shipments") && (
                  <>
                    <TableHead className="pl-5 w-[16%]">Shipment ID</TableHead>
                    <TableHead className="w-[18%]">Invoices</TableHead>
                    <TableHead className="w-[24%]">Customer & Location</TableHead>
                    <TableHead className="w-[14%]">Weight</TableHead>
                    <TableHead className="w-[14%]">Driver Info</TableHead>
                    <TableHead className="w-[14%] pr-5">Vehicle Info</TableHead>
                  </>
                )}
                {(activeStatView === "Pending Invoices for Dispatch" || activeStatView === "Pending Dispatch") && (
                  <>
                    <TableHead className="pl-5 w-[20%]">Shipment ID</TableHead>
                    <TableHead className="w-[20%]">Invoices</TableHead>
                    <TableHead className="w-[30%]">Customer</TableHead>
                    <TableHead className="w-[15%]">Weight</TableHead>
                    <TableHead className="w-[15%] pr-5">Status</TableHead>
                  </>
                )}
                {activeStatView === "Cancelled Invoices" && (
                  <>
                    <TableHead className="pl-5 w-[18%]">Shipment ID</TableHead>
                    <TableHead className="w-[14%]">Date</TableHead>
                    <TableHead className="w-[32%]">Customer</TableHead>
                    <TableHead className="w-[22%]">Location</TableHead>
                    <TableHead className="w-[14%] pr-5">Status</TableHead>
                  </>
                )}
                {activeStatView === "Deliveries Today" && (
                  <>
                    <TableHead className="pl-5 w-[18%]">Shipment ID</TableHead>
                    <TableHead className="w-[18%]">Invoices</TableHead>
                    <TableHead className="w-[26%]">Customer</TableHead>
                    <TableHead className="w-[12%]">Weight</TableHead>
                    <TableHead className="w-[13%]">Status</TableHead>
                    <TableHead className="w-[13%] pr-5">POD Status</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={10} className="p-0 border-none bg-slate-50/50">
                    <div className="w-full flex flex-col items-center justify-center py-12 px-6">
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
                  const invoices = item.invoicesList || (item.id ? [item.id] : []);
                  const weightVal = s?.totalWeightKg ?? item.weight;

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
                  if (activeStatView === "Pending Invoices for Dispatch" || activeStatView === "Pending Dispatch") {
                    return (
                      <TableRow key={idx} className="group cursor-default">
                        <TableCell className="pl-5"><span className="font-medium text-[#1d4ed8]">{item.id || "—"}</span></TableCell>
                        <TableCell><InvoicesDropdownCell invoices={invoices} /></TableCell>
                        <TableCell className="text-sm font-semibold text-slate-800">{item.customer || item.destination || "—"}</TableCell>
                        <TableCell><span className="text-sm text-slate-900 font-medium">{kg(weightVal)}</span></TableCell>
                        <TableCell className="pr-5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-200">
                            Pending
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  if (activeStatView === "In Transit Shipments" || activeStatView === "Active Shipments") {
                    return (
                      <TableRow key={idx} className="group cursor-default">
                        <TableCell className="pl-5"><span className="font-medium text-[#1d4ed8]">{item.id || "—"}</span></TableCell>
                        <TableCell><InvoicesDropdownCell invoices={invoices} /></TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground font-semibold">{item.destination || "—"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.location || s?.destinations?.[0]?.deliveryLocation || ""}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm text-foreground font-medium">{kg(weightVal)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground">{item.driver || "—"}</p>
                        </TableCell>
                        <TableCell className="pr-5">
                          <p className="text-sm text-foreground">{item.vehicle || "—"}</p>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  if (activeStatView === "Deliveries Today") {
                    const podUploaded = !!(s?.podFileUrl || s?.destinations?.some(d => d.podFileUrl) || item.podStatus === "Uploaded");
                    return (
                      <TableRow key={idx} className="group cursor-default">
                        <TableCell className="pl-5"><span className="font-medium text-[#1d4ed8]">{item.id || "—"}</span></TableCell>
                        <TableCell><InvoicesDropdownCell invoices={invoices} /></TableCell>
                        <TableCell className="text-sm font-semibold text-slate-800">{item.customer || item.destination || "—"}</TableCell>
                        <TableCell><span className="text-sm text-slate-900 font-medium">{kg(weightVal)}</span></TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Delivered
                          </span>
                        </TableCell>
                        <TableCell className="pr-5">
                          {podUploaded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <FileCheck className="w-3 h-3 text-emerald-600" />
                              POD Uploaded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              POD Pending
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return (
                    <TableRow key={idx} className="group cursor-default">
                      <TableCell className="pl-5"><span className="font-medium text-[#1d4ed8]">{item.id || "—"}</span></TableCell>
                      <TableCell><p className="text-sm text-foreground">{item.driver || item.customer || "—"}</p></TableCell>
                      <TableCell className="text-sm text-slate-600">{item.location || item.destination || "—"}</TableCell>
                      <TableCell><span className="text-sm text-muted-foreground">{formatDate(item.originalDate)}</span></TableCell>
                      <TableCell><span className="text-sm text-foreground">{item.vehicle || "—"}</span></TableCell>
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
