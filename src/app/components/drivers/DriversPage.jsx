import { useState, useEffect } from "react";
import DriverHeader from "./DriverHeader";
import DriverFiltersBar from "./DriverFiltersBar";
import DriverTable from "./DriverTable";
import AddDriverDialog from "./AddDriverDialog";
import { useDrivers } from "./hooks/useDrivers";
import { DriverDetailSheet } from "./DriverDetailSheet";
import { ViewShipmentSheet } from "../shipments/ViewShipmentSheet";

const API_BASE_URL = (import.meta.env?.VITE_API_URL || "http://localhost:5000/api") + "/drivers";

export function DriversPage() {
  const { drivers, loading, fetchDrivers } = useDrivers();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [viewShipmentOpen, setViewShipmentOpen] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Live refresh on socket cache update
  useEffect(() => {
    if (typeof fetchDrivers !== "function") return;
    const handler = () => fetchDrivers();
    window.addEventListener("api-cache-updated", handler);
    return () => window.removeEventListener("api-cache-updated", handler);
  }, [fetchDrivers]);

  const filtered = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery);
    const matchesType = typeFilter === "all" || d.driverType === typeFilter;
    const matchesStatus =
      statusFilter === "all" || d.tripStatus === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const openDriverSheet = (driver) => {
    setSelectedDriver(driver);
    setSheetOpen(true);
  };

  const closeDriverSheet = () => {
    setSheetOpen(false);
    setSelectedDriver(null);
  };

  const handleAddDriver = async (driverData) => {
    try {
      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(driverData),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Error adding driver:", error);
        return false;
      }

      await fetchDrivers();
      return true;
    } catch (error) {
      console.error("Error adding driver:", error);
      return false;
    }
  };

  const handleUpdateDriver = async (driverId, driverData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${driverId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(driverData),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Error updating driver:", error);
        return false;
      }

      await fetchDrivers();
      return true;
    } catch (error) {
      console.error("Error updating driver:", error);
      return false;
    }
  };

  const handleDeleteDriver = async (driverId) => {
    if (window.confirm("Are you sure you want to delete this driver?")) {
      try {
        const res = await fetch(`${API_BASE_URL}/${driverId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!res.ok) {
          console.error("Error deleting driver");
          return false;
        }

        await fetchDrivers();
        return true;
      } catch (error) {
        console.error("Error deleting driver:", error);
        return false;
      }
    }
    return false;
  };

  return (
    <div className="h-full flex flex-col">
      <DriverHeader
        drivers={drivers}
        onAddDriverClick={() => {
          setEditingDriver(null);
          setAddDialogOpen(true);
        }}
      />

      <DriverFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={() => {
          setSearchQuery("");
          setTypeFilter("all");
          setStatusFilter("all");
        }}
      />

      <DriverTable
        drivers={filtered}
        totalDrivers={drivers.length}
        loading={loading}
        onViewDriver={openDriverSheet}
        onEditDriver={(driver) => {
          setEditingDriver(driver);
          setAddDialogOpen(true);
        }}
        onDeleteDriver={handleDeleteDriver}
      />

      <DriverDetailSheet
        driver={selectedDriver}
        open={sheetOpen}
        onClose={closeDriverSheet}
        onViewShipment={(shipment) => {
          setSelectedShipment(shipment);
          setViewShipmentOpen(true);
        }}
      />

      <ViewShipmentSheet
        open={viewShipmentOpen}
        onOpenChange={(val) => {
          setViewShipmentOpen(val);
          if (!val) setSelectedShipment(null);
        }}
        shipment={selectedShipment}
      />

      <AddDriverDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAddDriver={handleAddDriver}
        onUpdateDriver={handleUpdateDriver}
        editingDriver={editingDriver}
      />
    </div>
  );
}

export default DriversPage;