import { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { ExpenseHeader } from "./ExpenseHeader";
import { ExpenseFiltersBar } from "./ExpenseFiltersBar";
import { ExpenseSummaryCards } from "./ExpenseSummaryCards";
import { ExpenseTable } from "./ExpenseTable";
import { AddExpenseModal } from "./AddExpenseModal";
import { EditExpenseModal } from "./EditExpenseModal";
import { ViewExpenseDialog } from "./ViewExpenseDialog";
import { ITEMS_PER_PAGE } from "./data/expensesData";

const getRobustApiUrl = () => {
  let raw = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";
  raw = raw.replace(/\/$/, "");
  if (!raw.endsWith("/api")) {
    raw += "/api";
  }
  return raw;
};
const API_BASE_URL = getRobustApiUrl();

export function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterShipment, setFilterShipment] = useState("all");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [filterDriver, setFilterDriver] = useState("all");
  const [filterExpenseType, setFilterExpenseType] = useState("all");
  const [filterDealer, setFilterDealer] = useState("all");
  const [filterDate, setFilterDate] = useState();
  const [dateOpen, setDateOpen] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState("tripId");
  const [sortDir, setSortDir] = useState("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalTripId, setAddModalTripId] = useState(null);
  const [viewExpense, setViewExpense] = useState(null);
  const [editExpense, setEditExpense] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Selection
  const [selectMode, setSelectMode] = useState(false);
  const [selectedTripIds, setSelectedTripIds] = useState(new Set());

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const [expRes, shipRes] = await Promise.all([
        fetch(`${API_BASE_URL}/expenses`, { credentials: "include" }).catch(err => {
          console.error("Failed fetching expenses:", err);
          return { ok: false };
        }),
        fetch(`${API_BASE_URL}/shipments?limit=1000`, { credentials: "include" }).catch(err => {
          console.error("Failed fetching shipments:", err);
          return { ok: false };
        })
      ]);
      if (!expRes.ok) throw new Error("Failed to fetch expenses");

      const expData = await expRes.json();
      let shipData = { data: [] };
      if (shipRes.ok) {
        shipData = await shipRes.json();
      }

      setExpenses(expData);
      setShipments(shipData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Live refresh on socket cache update
  useEffect(() => {
    const handler = () => fetchExpenses();
    window.addEventListener("api-cache-updated", handler);
    return () => window.removeEventListener("api-cache-updated", handler);
  }, []);

  // Filter dropdown data
  const shipmentIds = useMemo(() => {
    const ids = expenses.map((e) => e.tripId || e.lrNumber).filter(Boolean);
    return [...new Set(ids)];
  }, [expenses]);

  const vehicleIds = useMemo(() => {
    const ids = expenses.map((e) => e.vehicleId).filter(Boolean);
    return [...new Set(ids)];
  }, [expenses]);

  const driverNames = useMemo(() => {
    const names = expenses.map((e) => e.driverName).filter(Boolean);
    return [...new Set(names)];
  }, [expenses]);

  // Derived dealer options from active shipments list
  const dealerOptions = useMemo(() => {
    const allDealers = [];
    shipments.forEach((s) => {
      (s.destinations || []).forEach((d) => {
        if (d.customerName) allDealers.push(d.customerName.trim());
      });
    });
    return [...new Set(allDealers)].sort();
  }, [shipments]);

  // Map shipmentId to its total weight
  const shipmentWeightMap = useMemo(() => {
    const map = new Map();
    shipments.forEach((s) => {
      map.set(s.shipmentId, s.totalWeightKg || 0);
    });
    return map;
  }, [shipments]);

  // Map shipmentId to associated customer names (dealers)
  const shipmentCustomerMap = useMemo(() => {
    const map = new Map();
    shipments.forEach((s) => {
      const customers = [...new Set((s.destinations || []).map((d) => d.customerName).filter(Boolean))];
      map.set(s.shipmentId, customers.join(", ") || "N/A");
    });
    return map;
  }, [shipments]);

  // Filtered + sorted + grouped by Trip ID
  const processedData = useMemo(() => {
    let data = [...expenses];

    // 1. Grouping by Trip ID (or fallback)
    const groupedMap = new Map();
    data.forEach((e) => {
      const key = e.tripId || e.lrNumber || `manual-${e.driverName}-${e.vehicleId}`;
      if (!groupedMap.has(key)) {
        const totalWeightKg = shipmentWeightMap.get(e.tripId) || 0;
        const customerName = shipmentCustomerMap.get(e.tripId) || "N/A";

        groupedMap.set(key, {
          tripId: e.tripId || "No Trip ID",
          lrNumber: e.lrNumber || "N/A",
          driverName: e.driverName || "N/A",
          vehicleId: e.vehicleId || "N/A",
          date: e.date,
          status: e.status || "Pending",
          paymentMode: e.paymentMode || "Cash",
          amount: 0,
          totalWeightKg,
          customerName,
          breakdown: []
        });
      }

      const grp = groupedMap.get(key);
      grp.breakdown.push({
        ...e,
        amount: e.totalAmount !== undefined ? e.totalAmount : (e.amount || 0)
      });
      grp.amount += (e.totalAmount !== undefined ? e.totalAmount : (e.amount || 0));
    });

    let groupedData = Array.from(groupedMap.values());

    // 2. Deep Filtering (filter breakdown items and recalculate totals)
    groupedData = groupedData.map(g => {
      // Create a copy of the breakdown to filter
      let filteredBreakdown = [...g.breakdown];

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        // Only apply deep search filter if the group-level fields don't match
        const groupMatches = g.tripId.toLowerCase().includes(q) ||
          g.driverName.toLowerCase().includes(q) ||
          g.vehicleId.toLowerCase().includes(q) ||
          g.customerName.toLowerCase().includes(q);
        if (!groupMatches) {
          filteredBreakdown = filteredBreakdown.filter(e => (e.lrNumber || "").toLowerCase().includes(q));
        }
      }

      if (filterShipment !== "all") {
        if (g.tripId !== filterShipment) {
          filteredBreakdown = filteredBreakdown.filter(e => e.lrNumber === filterShipment);
        }
      }

      if (filterExpenseType !== "all") {
        filteredBreakdown = filteredBreakdown.map(e => {
          if (e.items && e.items.length > 0) {
            const matchingItems = e.items.filter(item => item.expenseType === filterExpenseType);
            if (matchingItems.length > 0) {
              const newAmount = matchingItems.reduce((s, i) => s + (i.amount || 0), 0);
              return { ...e, items: matchingItems, amount: newAmount, totalAmount: newAmount };
            }
            return null;
          }
          return e.expenseType === filterExpenseType ? e : null;
        }).filter(Boolean);
      }

      if (filterDate) {
        const target = new Date(filterDate);
        filteredBreakdown = filteredBreakdown.filter(e => {
          const ed = new Date(e.date);
          return ed.getFullYear() === target.getFullYear() &&
            ed.getMonth() === target.getMonth() &&
            ed.getDate() === target.getDate();
        });
      }

      // Recalculate group amount based on filtered breakdown
      const newGroupAmount = filteredBreakdown.reduce((sum, e) => sum + (e.totalAmount !== undefined ? e.totalAmount : (e.amount || 0)), 0);

      return {
        ...g,
        breakdown: filteredBreakdown,
        amount: newGroupAmount
      };
    }).filter(g => {
      // 3. Group-level filtering
      if (filterVehicle !== "all" && g.vehicleId !== filterVehicle) return false;
      if (filterDriver !== "all" && g.driverName !== filterDriver) return false;
      if (filterDealer !== "all") {
        const parts = g.customerName.split(",").map(p => p.trim());
        if (!parts.includes(filterDealer)) return false;
      }

      // Keep group only if it has matching breakdown items or matches all group filters
      return g.breakdown.length > 0;
    });

    // 4. Sorting
    groupedData.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return groupedData;
  }, [
    searchQuery,
    filterShipment,
    filterVehicle,
    filterDriver,
    filterDealer,
    filterExpenseType,
    filterDate,
    sortField,
    sortDir,
    expenses,
    shipmentWeightMap,
    shipmentCustomerMap,
  ]);

  const totalPages = Math.max(1, Math.ceil(processedData.length / ITEMS_PER_PAGE));
  const paginated = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Summary calculations
  const totalExpenses = expenses.reduce((s, e) => s + (e.totalAmount !== undefined ? e.totalAmount : (e.amount || 0)), 0);

  const getAmountByType = (type) => {
    return expenses.reduce((sum, e) => {
      if (e.items && e.items.length > 0) {
        return sum + e.items.filter((item) => item.expenseType === type).reduce((s, i) => s + (i.amount || 0), 0);
      }
      return sum + (e.expenseType === type ? (e.amount || 0) : 0);
    }, 0);
  };

  const fuelCost = getAmountByType("Fuel");
  const tollCharges = getAmountByType("Toll");
  const maintenance = getAmountByType("Maintenance");
  const otherExpenses = totalExpenses - fuelCost - tollCharges - maintenance;

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterShipment("all");
    setFilterVehicle("all");
    setFilterDriver("all");
    setFilterDealer("all");
    setFilterExpenseType("all");
    setFilterDate(undefined);
    setCurrentPage(1);
  };

  const handleToggleSelectMode = () => {
    setSelectMode((prev) => {
      if (prev) {
        setSelectedTripIds(new Set());
      }
      return !prev;
    });
  };

  const handleSelectTrip = (tripId) => {
    setSelectedTripIds((prev) => {
      const next = new Set(prev);
      if (next.has(tripId)) {
        next.delete(tripId);
      } else {
        next.add(tripId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = (checked) => {
    setSelectedTripIds((prev) => {
      const next = new Set(prev);
      paginated.forEach((t) => {
        if (checked) {
          next.add(t.tripId);
        } else {
          next.delete(t.tripId);
        }
      });
      return next;
    });
  };

  const addExpense = async (newExpense) => {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newExpense),
      });

      if (!response.ok) {
        throw new Error("Failed to save expense");
      }

      const savedExpense = await response.json();
      if (Array.isArray(savedExpense)) {
        setExpenses((prev) => [...savedExpense, ...prev]);
      } else {
        setExpenses((prev) => [savedExpense, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateExpense = async (id, payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update expense");

      const { data } = await response.json();
      setExpenses((prev) => prev.map((e) => (e._id === id ? { ...e, ...data } : e)));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteExpense = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete expense");

      setExpenses((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportZip = async () => {
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set("dateFrom", filterDate.toISOString());
      if (filterExpenseType !== "all") params.set("expenseType", filterExpenseType);
      if (selectMode && selectedTripIds.size > 0) {
        params.set("tripIds", Array.from(selectedTripIds).join(","));
      }

      const res = await fetch(`${API_BASE_URL}/expenses/export?${params.toString()}`, { credentials: "include" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Export failed"); }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `GNXT_Expenses_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("Export ZIP error:", err);
      alert("Export failed: " + err.message);
    }
  };

  const handleExport = () => {
    // Flatten the grouped data to show individual expenses
    const flattenedRows = [];

    // Filter by selected trips if selectMode is active and something is selected
    const dataToExport = selectMode && selectedTripIds.size > 0
      ? processedData.filter(group => selectedTripIds.has(group.tripId))
      : processedData;

    dataToExport.forEach((group) => {
      if (group.breakdown && group.breakdown.length > 0) {
        group.breakdown.forEach((expense) => {
          // If the expense has multiple items, flatten those too
          if (expense.items && expense.items.length > 0) {
            expense.items.forEach(item => {
              // Apply filterExpenseType at the item level if needed
              if (filterExpenseType !== "all" && item.expenseType !== filterExpenseType) return;

              flattenedRows.push({
                "Trip / Shipment ID": group.tripId || "No Trip ID",
                "LR Number": expense.lrNumber || "N/A",
                "Driver Name": group.driverName || "N/A",
                "Vehicle ID": group.vehicleId || "N/A",
                "Expense Type": item.expenseType || "N/A",
                "Amount (INR)": item.amount || 0,
                "Description": item.description || expense.description || "N/A",
                "Payment Mode": expense.paymentMode || "Cash",
                "Status": expense.status || "Pending",
                "Date": expense.date ? new Date(expense.date).toLocaleDateString("en-IN") : "N/A",
                "Dealer / Customer": group.customerName || "N/A",
                "Total kg per shipment": group.totalWeightKg || 0,
                "Receipt Link": expense.receiptUrl ? `${API_BASE_URL}/expenses/${expense._id}/receipt` : ""
              });
            });
          } else {
            flattenedRows.push({
              "Trip / Shipment ID": group.tripId || "No Trip ID",
              "LR Number": expense.lrNumber || "N/A",
              "Driver Name": group.driverName || "N/A",
              "Vehicle ID": group.vehicleId || "N/A",
              "Expense Type": expense.expenseType || "N/A",
              "Amount (INR)": expense.amount || 0,
              "Description": expense.description || "N/A",
              "Payment Mode": expense.paymentMode || "Cash",
              "Status": expense.status || "Pending",
              "Date": expense.date ? new Date(expense.date).toLocaleDateString("en-IN") : "N/A",
              "Dealer / Customer": group.customerName || "N/A",
              "Total kg per shipment": group.totalWeightKg || 0,
              "Receipt Link": expense.receiptUrl ? `${API_BASE_URL}/expenses/${expense._id}/receipt` : ""
            });
          }
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(flattenedRows);

    // Make "Receipt Link" column clickable hyperlinks in SheetJS
    for (let i = 0; i < flattenedRows.length; i++) {
      const rowNum = i + 2;
      const cellRef = `M${rowNum}`;
      const url = flattenedRows[i]["Receipt Link"];
      if (url) {
        worksheet[cellRef] = {
          t: "s",
          v: "View Receipt",
          l: { Target: url, Tooltip: "Click to open receipt" }
        };
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

    // Auto-size columns slightly
    const wscols = [
      { wch: 20 }, // Trip ID
      { wch: 15 }, // LR Number
      { wch: 20 }, // Driver
      { wch: 15 }, // Vehicle
      { wch: 15 }, // Type
      { wch: 15 }, // Amount
      { wch: 30 }, // Description
      { wch: 15 }, // Payment Mode
      { wch: 15 }, // Status
      { wch: 15 }, // Date
      { wch: 25 }, // Customer
      { wch: 20 }, // Total Kg
      { wch: 18 }  // Receipt Link
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `GNXT_Expenses_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const hasActiveFilters =
    searchQuery ||
    filterShipment !== "all" ||
    filterVehicle !== "all" ||
    filterDriver !== "all" ||
    filterDealer !== "all" ||
    filterExpenseType !== "all" ||
    filterDate;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <ExpenseHeader
        onAddExpense={() => {
          setAddModalTripId(null);
          setAddModalOpen(true);
        }}
        onExport={handleExport}
        onExportZip={handleExportZip}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        dateOpen={dateOpen}
        setDateOpen={setDateOpen}
        filterExpenseType={filterExpenseType}
        setFilterExpenseType={setFilterExpenseType}
        setCurrentPage={setCurrentPage}
        selectMode={selectMode}
        onToggleSelectMode={handleToggleSelectMode}
        selectedCount={selectedTripIds.size}
      />

      <ExpenseFiltersBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setCurrentPage={setCurrentPage}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        dateOpen={dateOpen}
        setDateOpen={setDateOpen}
        filterShipment={filterShipment}
        setFilterShipment={setFilterShipment}
        filterVehicle={filterVehicle}
        setFilterVehicle={setFilterVehicle}
        filterDriver={filterDriver}
        setFilterDriver={setFilterDriver}
        filterDealer={filterDealer}
        setFilterDealer={setFilterDealer}
        filterExpenseType={filterExpenseType}
        setFilterExpenseType={setFilterExpenseType}
        shipmentIds={shipmentIds}
        vehicleIds={vehicleIds}
        driverNames={driverNames}
        dealerOptions={dealerOptions}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <ExpenseSummaryCards
        totalExpenses={totalExpenses}
        fuelCost={fuelCost}
        tollCharges={tollCharges}
        maintenance={maintenance}
        otherExpenses={otherExpenses}
      />

      <ExpenseTable
        paginated={paginated}
        filtered={processedData}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        sortField={sortField}
        sortDir={sortDir}
        toggleSort={toggleSort}
        onViewExpense={setViewExpense}
        onAddExpenseForTrip={(tripId) => {
          setAddModalTripId(tripId);
          setAddModalOpen(true);
        }}
        onEditExpense={(expense) => {
          setEditExpense(expense);
          setEditModalOpen(true);
        }}
        onDeleteExpense={deleteExpense}
        selectMode={selectMode}
        selectedTripIds={selectedTripIds}
        onSelectTrip={handleSelectTrip}
        onToggleSelectAll={handleToggleSelectAll}
      />

      <AddExpenseModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        tripId={addModalTripId}
        onSave={addExpense}
        shipments={shipments}
      />

      <ViewExpenseDialog
        expense={viewExpense}
        onClose={() => setViewExpense(null)}
      />

      <EditExpenseModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        expense={editExpense}
        onSave={updateExpense}
      />
    </div>
  );
}
export default ExpensesPage;
