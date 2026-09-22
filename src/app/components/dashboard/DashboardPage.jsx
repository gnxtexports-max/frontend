import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import axios from "axios";
import { DashboardHeader } from "./DashboardHeader";
import { InvoiceSummarySection } from "./InvoiceSummarySection";
import { DespatchSummarySection } from "./DespatchSummarySection";
import { PendingPODsPanel } from "./PendingPODsPanel";
import { StatDetailView } from "./StatDetailView";
import { ViewShipmentSheet } from "../shipments/ViewShipmentSheet";
import { getPODConfig } from "../shipments/utils/shipmentStyles";

// We'll use our API base URL
const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

export function DashboardPage() {
  const getDefaultFromDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  };

  const getDefaultToDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const navigate = useNavigate();
  const [activeStatView, setActiveStatView] = useState(null);
  const [activeStatSection, setActiveStatSection] = useState("default");
  const [activeStatItems, setActiveStatItems] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [podFilter, setPodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(undefined);
  const [fromDate, setFromDate] = useState(getDefaultFromDate());
  const [toDate, setToDate] = useState(getDefaultToDate());
  const [showHistory, setShowHistory] = useState(true);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  // Persistent Date States for Invoice Summary: separated draft vs applied
  const [invoiceDraftFromDate, setInvoiceDraftFromDate] = useState("2026-08-31");
  const [invoiceDraftToDate, setInvoiceDraftToDate] = useState("2026-09-09");
  const [invoiceAppliedFromDate, setInvoiceAppliedFromDate] = useState("2026-08-31");
  const [invoiceAppliedToDate, setInvoiceAppliedToDate] = useState("2026-09-09");

  // Persistent Date States for Despatch Summary: separated draft vs applied
  const [despatchDraftFromDate, setDespatchDraftFromDate] = useState("2026-08-31");
  const [despatchDraftToDate, setDespatchDraftToDate] = useState("2026-09-09");
  const [despatchAppliedFromDate, setDespatchAppliedFromDate] = useState("2026-08-31");
  const [despatchAppliedToDate, setDespatchAppliedToDate] = useState("2026-09-09");

  const handleCardClick = (title, section = "default", items = []) => {
    if (title === "Expenses") {
      navigate("/expenses");
      return;
    }
    setActiveStatView(title);
    setActiveStatSection(section);
    setActiveStatItems(items || []);
  };

  // Data states
  const [stats, setStats] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [currentShipments, setCurrentShipments] = useState([]);
  const [historicalShipments, setHistoricalShipments] = useState([]);
  const [pendingPODs, setPendingPODs] = useState([]);
  const [cancelledInvoices, setCancelledInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen for api-cache-updated events to do silent refresh
  useEffect(() => {
    const handler = () => fetchDashboardData(true);
    window.addEventListener("api-cache-updated", handler);
    return () => window.removeEventListener("api-cache-updated", handler);
  }, [fromDate, toDate]);

  const fetchDashboardData = async (silent = false, fDate = fromDate, tDate = toDate) => {
    if (!silent) setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (fDate) queryParams.append("fromDate", fDate);
      if (tDate) queryParams.append("toDate", tDate);
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

      const shipmentQuery = new URLSearchParams({ limit: "200" });
      if (fDate) shipmentQuery.append("fromDate", fDate);
      if (tDate) shipmentQuery.append("toDate", tDate);

      const invoiceQuery = new URLSearchParams({ status: "Pending" });
      const cancelledQuery = new URLSearchParams({ status: "Cancelled", all: "true", limit: "200" });

      const [statsRes, weeklyRes, shipmentsRes, invoicesRes, cancelledInvoicesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard/stats`).catch(() => ({ data: { success: false } })),
        axios.get(`${API_BASE_URL}/dashboard/weekly${queryString}`).catch(() => ({ data: { success: false } })),
        axios.get(`${API_BASE_URL}/shipments?limit=300`).catch(() => ({ data: { success: false } })),
        axios.get(`${API_BASE_URL}/invoices?${invoiceQuery.toString()}`).catch(() => ({ data: { success: false } })),
        axios.get(`${API_BASE_URL}/invoices?${cancelledQuery.toString()}`).catch(() => ({ data: { success: false } }))
      ]);

      if (statsRes.data?.success) {
        setStats(Array.isArray(statsRes.data.data) ? statsRes.data.data : []);
      }
      if (weeklyRes.data?.success) {
        setWeeklyData(Array.isArray(weeklyRes.data.data) ? weeklyRes.data.data : []);
      }

      if (shipmentsRes.data?.success || Array.isArray(shipmentsRes.data)) {
        const shipments = Array.isArray(shipmentsRes.data?.data)
          ? shipmentsRes.data.data
          : Array.isArray(shipmentsRes.data)
          ? shipmentsRes.data
          : [];
        const active = shipments
          .filter(s => s && s.status !== "Delivered" && s.status !== "Cancelled")
          .map(formatShipmentForTable);
        const history = shipments
          .filter(s => s && ["Delivered", "Cancelled", "Closed"].includes(s.status))
          .map(formatShipmentForTable);

        setCurrentShipments(active);
        setHistoricalShipments(history);
      }

      if (invoicesRes.data?.success || Array.isArray(invoicesRes.data)) {
        const invoiceList = Array.isArray(invoicesRes.data?.data)
          ? invoicesRes.data.data
          : Array.isArray(invoicesRes.data)
          ? invoicesRes.data
          : [];
        const pods = invoiceList.map(inv => ({
          id: inv.invoiceNumber,
          dealer: inv.customerName,
          date: new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
          shipmentId: inv.plantReferenceNumber || "N/A",
          status: inv.status === "Pending" ? "Awaiting Upload" : "Verification Pending"
        }));
        setPendingPODs(pods);
      }

      if (cancelledInvoicesRes.data?.success || Array.isArray(cancelledInvoicesRes.data)) {
        const cancelledList = Array.isArray(cancelledInvoicesRes.data?.data)
          ? cancelledInvoicesRes.data.data
          : Array.isArray(cancelledInvoicesRes.data)
          ? cancelledInvoicesRes.data
          : [];
        setCancelledInvoices(cancelledList);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    fetchDashboardData(false, fromDate, toDate);
  };

  const handleClearDates = () => {
    const defFrom = getDefaultFromDate();
    const defTo = getDefaultToDate();
    setFromDate(defFrom);
    setToDate(defTo);
    fetchDashboardData(false, defFrom, defTo);
  };

  const formatShipmentForTable = (s) => {
    let invoicesList = [];
    if (s.destinations && Array.isArray(s.destinations)) {
      s.destinations.forEach(d => {
        if (d.invoiceNumbers && Array.isArray(d.invoiceNumbers) && d.invoiceNumbers.length > 0) {
          invoicesList.push(...d.invoiceNumbers);
        } else if (d.plantReferenceNumber) {
          const parts = d.plantReferenceNumber.split(',').map(p => p.trim()).filter(Boolean);
          invoicesList.push(...parts);
        }
      });
    }
    if (invoicesList.length === 0 && s.plantReferenceNumber) {
      invoicesList = s.plantReferenceNumber.split(',').map(p => p.trim()).filter(Boolean);
    }
    if (invoicesList.length === 0 && s.shipmentId) {
      invoicesList = [s.shipmentId];
    }

    return {
      id: s.shipmentId,
      vehicle: s.vehicleNumber || "Unknown",
      driver: s.driverName || "Unknown",
      destination: s.destinations?.[0]?.customerName || s.destinations?.[0]?.deliveryLocation || "Unknown",
      customer: s.destinations?.[0]?.customerName || "Unknown",
      location: s.destinations?.[0]?.deliveryLocation || "—",
      weight: s.totalWeightKg || 0,
      invoicesList,
      status: s.status,
      progress: s.status === "Delivered" ? 100 : (s.status === "In Transit" ? 60 : 10),
      eta: s.deliveryDate ? format(new Date(s.deliveryDate), "MMM d, yyyy h:mm a") : "Pending",
      items: `${s.totalQuantity || 0} Items`,
      podConfig: getPODConfig(s),
      podStatus: getPODConfig(s).label,
      originalDate: s.dispatchDate || s.createdAt,
      originalData: s
    };
  };

  const isToday = (d) => {
    if (!d) return false;
    const date = new Date(d);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  let baseData = [];

  // When card clicked with direct items (from Invoice Summary or Despatch Summary), strictly use those items
  if (activeStatSection === "invoice" || activeStatSection === "despatch") {
    baseData = activeStatItems || [];
  } else if (activeStatItems && activeStatItems.length > 0) {
    baseData = activeStatItems;
  } else {
    const uniqueShipmentMap = new Map();
    [...currentShipments, ...historicalShipments].forEach(s => {
      const key = s.id || s._id;
      if (key && !uniqueShipmentMap.has(key)) {
        uniqueShipmentMap.set(key, s);
      }
    });
    const allShipments = Array.from(uniqueShipmentMap.values());

    if (activeStatView === "In Transit Shipments" || activeStatView === "Active Shipments" || activeStatView === "In Transit Invoices") {
      baseData = allShipments.filter(s => s.status === "In Transit");
    } else if (activeStatView === "Pending Invoices for Dispatch" || activeStatView === "Pending Dispatch" || activeStatView === "Pending Invoices") {
      baseData = allShipments.filter(s => s.status === "Pending");
    } else if (activeStatView === "Cancelled Invoices") {
      baseData = cancelledInvoices
        .map(plant => ({
          id: plant.invoices?.[0]?.invoiceNumber || plant.invoiceNumber || "—",
          invoiceNumber: plant.invoices?.[0]?.invoiceNumber || plant.invoiceNumber || "—",
          originalDate: plant.cancelledAt || plant.createdAt,
          invoiceDate: plant.invoiceDate || plant.cancelledAt || plant.createdAt,
          customerName: plant.customerName,
          customer: plant.customerName,
          location: plant.location || "—",
          status: plant.status,
          weight: plant.invoices?.[0]?.weight || plant.weight || 0,
          cancellationReason: plant.invoices?.[0]?.cancellationReason || plant.cancellationReason || "Cancelled",
          allInvoices: plant.invoices,
          invoicesList: plant.invoices?.map(i => i.invoiceNumber) || [plant.invoiceNumber].filter(Boolean)
        }));
    } else if (activeStatView === "Deliveries Today" || activeStatView === "Delivered Invoices") {
      baseData = allShipments.filter(s => ["Delivered", "Closed"].includes(s.status)).map(s => ({
        ...s,
        customer: s.originalData?.destinations?.[0]?.customerName || s.customer,
        location: s.originalData?.destinations?.[0]?.deliveryLocation || s.location,
        weight: s.originalData?.totalWeightKg ?? s.weight,
      }));
    } else if (activeStatView === "Pending PODs") {
      baseData = allShipments.filter(s => {
        const dests = s.originalData?.destinations || [];
        return dests.some(d => !d.podImages || d.podImages.length === 0);
      });
    } else if (activeStatView === "Total Invoices" || activeStatView === "Search Results") {
      baseData = allShipments;
    } else if (activeStatView) {
      baseData = showHistory ? historicalShipments : currentShipments;
    }
  }

  // Apply search and filter
  const tableData = baseData.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (item.id?.toLowerCase().includes(q)) ||
      (item.shipmentId?.toLowerCase().includes(q)) ||
      (item.invoiceNumber?.toLowerCase().includes(q)) ||
      (item.driver?.toLowerCase().includes(q)) ||
      (item.vehicle?.toLowerCase().includes(q)) ||
      (item.customer?.toLowerCase().includes(q)) ||
      (item.customerName?.toLowerCase().includes(q)) ||
      (item.location?.toLowerCase().includes(q)) ||
      (item.status?.toLowerCase().includes(q));

    const matchesPod =
      podFilter === "all" ||
      item.podStatus === podFilter;

    let matchesDate = true;
    if (showHistory && dateFilter) {
      const filterDateStr = dateFilter.toDateString();
      const rawDate = item.invoiceDate || item.dispatchDate || item.originalDate;
      const itemDateStr = rawDate ? new Date(rawDate).toDateString() : "";
      matchesDate = filterDateStr === itemDateStr;
    }

    return matchesSearch && matchesPod && matchesDate;
  });

  return (
    <>
      {activeStatView ? (
        <StatDetailView
          activeStatView={activeStatView}
          activeStatSection={activeStatSection}
          onBack={() => {
            setActiveStatView(null);
            setActiveStatSection("default");
            setActiveStatItems([]);
          }}
          tableData={tableData}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          podFilter={podFilter}
          setPodFilter={setPodFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          onView={(item) => {
            if (item.originalData) {
              setSelectedShipment(item.originalData);
              setViewSheetOpen(true);
            }
          }}
        />
      ) : (
        /* Content utilizes full available width */
        <div className="p-6 md:p-8 w-full space-y-6">
          <DashboardHeader />

          {loading && !stats.length && !currentShipments.length ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          ) : (
            <>
              {/* SECTION 1: INVOICE SUMMARY (Invoice Date) */}
              <InvoiceSummarySection 
                onCardClick={handleCardClick}
                initialFromDate="2026-08-31"
                initialToDate="2026-09-09"
                draftFromDate={invoiceDraftFromDate}
                setDraftFromDate={setInvoiceDraftFromDate}
                draftToDate={invoiceDraftToDate}
                setDraftToDate={setInvoiceDraftToDate}
                appliedFromDate={invoiceAppliedFromDate}
                setAppliedFromDate={setInvoiceAppliedFromDate}
                appliedToDate={invoiceAppliedToDate}
                setAppliedToDate={setInvoiceAppliedToDate}
              />

              {/* SECTION 2: DESPATCH SUMMARY (Despatch Date) */}
              <DespatchSummarySection 
                onCardClick={handleCardClick}
                initialFromDate="2026-08-31"
                initialToDate="2026-09-09"
                draftFromDate={despatchDraftFromDate}
                setDraftFromDate={setDespatchDraftFromDate}
                draftToDate={despatchDraftToDate}
                setDraftToDate={setDespatchDraftToDate}
                appliedFromDate={despatchAppliedFromDate}
                setAppliedFromDate={setDespatchAppliedFromDate}
                appliedToDate={despatchAppliedToDate}
                setAppliedToDate={setDespatchAppliedToDate}
              />

              {/* SECTION 3: Shipment Operational Flow */}
              <PendingPODsPanel />
            </>
          )}
        </div>
      )}
      <ViewShipmentSheet
        open={viewSheetOpen}
        onOpenChange={setViewSheetOpen}
        shipment={selectedShipment}
        onStatusChange={() => fetchDashboardData()}
      />
    </>
  );
}
export default DashboardPage;
