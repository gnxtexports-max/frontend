import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import {
  X,
  Phone as PhoneIcon,
  IdCard,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

/* ── STATUS STYLES ─────────────────────────────── */

const driverTypeBadgeStyles = {
  Own: "bg-blue-50 text-blue-700 border-blue-200",
  Hired: "bg-amber-50 text-amber-700 border-amber-200",
  Contract: "bg-teal-50 text-teal-700 border-teal-200",
};

/* ── COMPONENT ─────────────────────────────────── */

export function DriverDetailSheet({ driver, open, onClose, onViewShipment }) {
  const [historyPage, setHistoryPage] = useState(0);
  const [shipments, setShipments] = useState([]);
  const [loadingShipments, setLoadingShipments] = useState(false);

  const pageSize = 5;

  /* ── Fetch real shipments for this driver ── */
  useEffect(() => {
    if (!driver?._id || !open) return;

    setHistoryPage(0);
    setShipments([]);
    setLoadingShipments(true);

    fetch(`${API_BASE_URL}/shipments/by-driver/${driver._id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setShipments(res.data ?? []);
      })
      .catch((err) => console.error("Failed to load driver shipments:", err))
      .finally(() => setLoadingShipments(false));
  }, [driver?._id, open]);

  if (!driver || !open) return null;

  const typeStyle = driverTypeBadgeStyles[driver.driverType] ?? "bg-slate-50 text-slate-700 border-slate-200";

  const totalPages = Math.ceil(shipments.length / pageSize);
  const pagedShipments = shipments.slice(
    historyPage * pageSize,
    (historyPage + 1) * pageSize
  );

  /* ── Derive display values from real shipment ── */
  const getDealer = (s) => {
    const dest = s.destinations?.[0];
    return dest?.customerName || dest?.plantReferenceNumber || "—";
  };

  const getVehicle = (s) => {
    if (typeof s.vehicleId === "object" && s.vehicleId?.vehicleNo) return s.vehicleId.vehicleNo;
    return s.vehicleNumber || "—";
  };

  const getDeliveryDate = (s) => {
    const d = s.deliveryDate || s.dispatchDate;
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  /* ── Close driver sheet and open Shipment Details ── */
  const handleViewShipment = (s) => {
    onClose();
    if (onViewShipment) onViewShipment(s);
  };

  const sheetContent = (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 animate-in fade-in-0 duration-300"
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div className="absolute inset-y-0 right-0 w-[80%] max-w-[1050px] bg-[#f5f6f8] shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-400">
        {/* ── HEADER ─── */}
        <div className="bg-white border-b border-border px-6 py-5 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#7c3aed] flex items-center justify-center shrink-0">
                <span className="text-sm text-white">{driver.avatar}</span>
              </div>
              <div>
                <h2 className="text-foreground text-lg">{driver.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {driver._id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-border bg-white hover:bg-slate-50 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ─── */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-6">
            {/* ── SECTION 1: BASIC INFO ─── */}
            <div className="bg-white rounded-xl border border-border">
              <div className="px-5 py-3.5 border-b border-border">
                <h3 className="text-sm text-foreground flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-[#1d4ed8]" />
                  Driver Information
                </h3>
              </div>
              <div className="p-5 grid grid-cols-3 gap-x-8 gap-y-4">
                <InfoField label="Driver Type">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${typeStyle}`}
                  >
                    {driver.driverType}
                  </span>
                </InfoField>
                <InfoField label="Phone Number">
                  <a
                    href={`tel:${driver.phone?.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-[#1d4ed8] transition-colors"
                  >
                    <PhoneIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    {driver.phone}
                  </a>
                </InfoField>
                <InfoField label="License Number">
                  <span className="text-sm text-foreground">
                    {driver.licenseNumber || "—"}
                  </span>
                </InfoField>
                <InfoField label="Experience">
                  <span className="text-sm text-foreground">
                    {driver.age} age
                  </span>
                </InfoField>
              </div>
            </div>

            {/* ── SECTION 2: PAST SHIPMENT HISTORY ─── */}
            <div className="bg-white rounded-xl border border-border">
              <div className="px-5 py-3.5 border-b border-border">
                <h3 className="text-sm text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#1d4ed8]" />
                  Past Shipment History
                  {!loadingShipments && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {shipments.length} shipment{shipments.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </h3>
              </div>

              {loadingShipments ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading shipments…</span>
                </div>
              ) : shipments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No shipments found for this driver.</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Shipments will appear here once assigned.</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#f8f9fb] hover:bg-[#f8f9fb]">
                        <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-2.5 pl-5">
                          Shipment ID
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-2.5">
                          Dealer
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-2.5">
                          Vehicle
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-2.5">
                          Delivery Date
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-2.5">
                          Status
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground uppercase tracking-wider py-2.5 pr-5 text-right">
                          View
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedShipments.map((s) => (
                        <TableRow
                          key={s._id}
                          className="hover:bg-[#f8f9fb]/60 transition-colors"
                        >
                          <TableCell className="py-2.5 pl-5">
                            <button
                              onClick={() => handleViewShipment(s)}
                              className="text-sm text-[#1d4ed8] hover:underline cursor-pointer"
                            >
                              {s.shipmentId || s._id}
                            </button>
                          </TableCell>
                          <TableCell className="py-2.5 text-sm text-foreground">
                            {getDealer(s)}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <span className="text-xs text-foreground bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                              {getVehicle(s)}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 text-sm text-muted-foreground">
                            {getDeliveryDate(s)}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${
                                s.status === "Delivered"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : s.status === "In Transit"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : s.status === "Pending"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {s.status}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 pr-5 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-[#1d4ed8] hover:bg-[#1d4ed8]/5"
                              onClick={() => handleViewShipment(s)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {totalPages > 1 && (
                    <div className="px-5 py-3 border-t border-border bg-[#f8f9fb]/50 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Page {historyPage + 1} of {totalPages}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          disabled={historyPage === 0}
                          onClick={() => setHistoryPage((p) => p - 1)}
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          disabled={historyPage >= totalPages - 1}
                          onClick={() => setHistoryPage((p) => p + 1)}
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* ── STICKY FOOTER — Edit Driver removed ─── */}
        <div className="bg-white border-t border-border px-6 py-4 shrink-0 flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

    </div>
  );

  return createPortal(sheetContent, document.body);
}

/* ── SUB COMPONENTS ────────────────────────────── */

function InfoField({ label, children }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      {children}
    </div>
  );
}