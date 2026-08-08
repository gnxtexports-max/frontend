import { useState, useEffect } from "react";
import { format } from "date-fns";
import axios from "axios";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardStatsGrid } from "./DashboardStatsGrid";
import { DashboardChart } from "./DashboardChart";
import { PendingPODsPanel } from "./PendingPODsPanel";
import { InvoiceDispatchSummary } from "./InvoiceDispatchSummary";
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

  const [activeStatView, setActiveStatView] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [podFilter, setPodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(undefined);
  const [fromDate, setFromDate] = useState(getDefaultFromDate());
  const [toDate, setToDate] = useState(getDefaultToDate());
  const [showHistory, setShowHistory] = useState(true);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

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

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (weeklyRes.data?.success) setWeeklyData(weeklyRes.data.data);

      if (shipmentsRes.data?.success) {
        const shipments = shipmentsRes.data.data;
        const active = shipments
          .filter(s => s.status !== "Delivered" && s.status !== "Cancelled")
          .map(formatShipmentForTable);
        const history = shipments
          .filter(s => ["Delivered", "Cancelled", "Closed"].includes(s.status))
          .map(formatShipmentForTable);

        setCurrentShipments(active);
        setHistoricalShipments(history);
      }

      if (invoicesRes.data?.success) {
        const pods = invoicesRes.data.data.map(inv => ({
          id: inv.invoiceNumber,
          dealer: inv.customerName,
          date: new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
          shipmentId: inv.plantReferenceNumber || "N/A",
          status: inv.status === "Pending" ? "Awaiting Upload" : "Verification Pending"
        }));
        setPendingPODs(pods);
      }

      if (cancelledInvoicesRes.data?.success) {
        setCancelledInvoices(cancelledInvoicesRes.data.data || []);
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
  const uniqueShipmentMap = new Map();
  [...currentShipments, ...historicalShipments].forEach(s => {
    const key = s.id || s._id;
    if (key && !uniqueShipmentMap.has(key)) {
      uniqueShipmentMap.set(key, s);
    }
  });
  const allShipments = Array.from(uniqueShipmentMap.values());

  if (activeStatView === "In Transit Shipments" || activeStatView === "Active Shipments") {
    baseData = allShipments.filter(s => s.status === "In Transit");
  } else if (activeStatView === "Pending Invoices for Dispatch" || activeStatView === "Pending Dispatch") {
    baseData = allShipments.filter(s => s.status === "Pending");
  } else if (activeStatView === "Cancelled Invoices") {
    baseData = cancelledInvoices
      .filter(plant => isToday(plant.cancelledAt || plant.createdAt))
      .map(plant => ({
        id: plant.invoices?.[0]?.invoiceNumber || "—",
        originalDate: plant.cancelledAt || plant.createdAt,
        customer: plant.customerName,
        location: plant.location || "—",
        status: plant.status,
        allInvoices: plant.invoices,
        invoicesList: plant.invoices?.map(i => i.invoiceNumber) || []
      }));
  } else if (activeStatView === "Deliveries Today") {
    baseData = allShipments.filter(s => {
      const isDelivered = ["Delivered", "Closed"].includes(s.status);
      const deliveryDateVal = s.originalData?.deliveryDate || s.originalDate || s.createdAt;
      return isDelivered && isToday(deliveryDateVal);
    }).map(s => ({
      ...s,
      customer: s.originalData?.destinations?.[0]?.customerName || s.customer,
      location: s.originalData?.destinations?.[0]?.deliveryLocation || s.location,
      weight: s.originalData?.totalWeightKg ?? s.weight,
    }));
  } else if (activeStatView) {
    baseData = showHistory ? historicalShipments : currentShipments;
  }

  // Calculate dynamic stats from table datasets for 100% card-table parity
  const computeStatsWithTableSync = (rawStats = []) => {
    if (!rawStats || rawStats.length === 0) return rawStats;

    return rawStats.map(stat => {
      if (stat.title === "Cancelled Invoices") {
        const cancelledTodayItems = cancelledInvoices.filter(plant =>
          isToday(plant.cancelledAt || plant.createdAt)
        );
        return {
          ...stat,
          value: cancelledTodayItems.length.toString()
        };
      }

      if (stat.title === "Deliveries Today") {
        const deliveredTodayItems = allShipments.filter(s => {
          const isDelivered = ["Delivered", "Closed"].includes(s.status);
          const dateVal = s.originalData?.deliveryDate || s.originalDate || s.createdAt;
          return isDelivered && isToday(dateVal);
        });

        let totalInvoices = 0;
        let totalWeight = 0;
        deliveredTodayItems.forEach(s => {
          totalWeight += (s.originalData?.totalWeightKg ?? s.weight ?? 0);
          totalInvoices += (s.invoicesList?.length || 1);
        });

        return {
          ...stat,
          value: deliveredTodayItems.length.toString(),
          deliveredInvoices: totalInvoices,
          deliveredWeight: totalWeight,
          deliveredWeightFormatted: `${totalWeight.toLocaleString("en-IN", { maximumFractionDigits: 2 })} kg`
        };
      }

      if (stat.title === "Pending Invoices for Dispatch") {
        const pendingItems = allShipments.filter(s => s.status === "Pending");
        let totalInvoices = 0;
        let totalWeight = 0;

        pendingItems.forEach(s => {
          totalWeight += (s.originalData?.totalWeightKg ?? s.weight ?? 0);
          totalInvoices += (s.invoicesList?.length || 1);
        });

        return {
          ...stat,
          value: pendingItems.length.toString(),
          pendingInvoices: totalInvoices,
          pendingWeight: totalWeight,
          pendingWeightFormatted: `${totalWeight.toLocaleString("en-IN", { maximumFractionDigits: 2 })} kg`
        };
      }

      if (stat.title === "In Transit Shipments") {
        const inTransitItems = allShipments.filter(s => s.status === "In Transit");
        let totalInvoices = 0;
        let totalWeight = 0;
        inTransitItems.forEach(s => {
          totalWeight += (s.originalData?.totalWeightKg ?? s.weight ?? 0);
          totalInvoices += (s.invoicesList?.length || 1);
        });

        return {
          ...stat,
          value: inTransitItems.length.toString(),
          inTransitInvoices: totalInvoices,
          inTransitWeight: totalWeight,
          inTransitWeightFormatted: `${totalWeight.toLocaleString("en-IN", { maximumFractionDigits: 2 })} kg`
        };
      }

      return stat;
    });
  };

  const displayStats = computeStatsWithTableSync(stats);

  // Apply search filter
  const tableData = baseData.filter((item) => {
    const matchesSearch =
      (item.id?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.driver?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.vehicle?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.customer?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.location?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPod =
      podFilter === "all" ||
      item.podStatus === podFilter;
    let matchesDate = true;
    if (showHistory && dateFilter) {
      const filterDateStr = dateFilter.toDateString();
      const itemDateStr = new Date(item.originalDate).toDateString();
      matchesDate = filterDateStr === itemDateStr;
    }

    return matchesSearch && matchesPod && matchesDate;
  });

  return (
    <>
      {activeStatView && !loading ? (
        <StatDetailView
          activeStatView={activeStatView}
          onBack={() => setActiveStatView(null)}
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
        /* Removed max-w-[1600px] & mx-auto to allow dashboard content to utilize full available width */
        <div className="p-6 md:p-8 w-full space-y-8">
          <DashboardHeader />
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          ) : (
            <>
              <DashboardStatsGrid onStatClick={setActiveStatView} stats={displayStats} />
              <DashboardChart
                weeklyData={weeklyData}
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
                onApply={handleApplyFilter}
                onReset={handleClearDates}
                loading={loading}
              />
              <InvoiceDispatchSummary fromDate={fromDate} toDate={toDate} />
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
