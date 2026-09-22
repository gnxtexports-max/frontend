import { useState, useEffect, useCallback } from "react";
import SupervisorHeader from "./SupervisorHeader";
import SupervisorFiltersBar from "./SupervisorFiltersBar";
import SupervisorTable from "./SupervisorTable";
import AddSupervisorDialog from "./AddSupervisorDialog";
import { useSupervisors } from "./hooks/useSupervisors";

const API_BASE_URL = (import.meta.env?.VITE_API_URL || "http://localhost:5000/api") + "/supervisors";

export function SupervisorsPage() {
  const { supervisors, loading, fetchSupervisors } = useSupervisors();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);

  useEffect(() => {
    fetchSupervisors();
  }, [fetchSupervisors]);

  // Live refresh on socket cache update
  useEffect(() => {
    const handler = () => fetchSupervisors();
    window.addEventListener("api-cache-updated", handler);
    return () => window.removeEventListener("api-cache-updated", handler);
  }, [fetchSupervisors]);

  const filtered = supervisors.filter((s) => {
    const matchesSearch =
      (s.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (s.employeeId?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (s.phone || "").includes(searchQuery);
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddSupervisor = async (data) => {
    try {
      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Error adding supervisor");
        return false;
      }

      await fetchSupervisors();
      return true;
    } catch (error) {
      console.error("Error adding supervisor:", error);
      alert("Error adding supervisor");
      return false;
    }
  };

  const handleUpdateSupervisor = async (id, data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Error updating supervisor");
        return false;
      }

      await fetchSupervisors();
      return true;
    } catch (error) {
      console.error("Error updating supervisor:", error);
      alert("Error updating supervisor");
      return false;
    }
  };

  const handleDeleteSupervisor = async (id) => {
    if (window.confirm("Are you sure you want to delete this supervisor?")) {
      try {
        const res = await fetch(`${API_BASE_URL}/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.message || "Error deleting supervisor");
          return false;
        }

        await fetchSupervisors();
        return true;
      } catch (error) {
        console.error("Error deleting supervisor:", error);
        alert("Error deleting supervisor");
        return false;
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fb] overflow-hidden">
      <SupervisorHeader
        supervisors={supervisors}
        onAddSupervisorClick={() => {
          setEditingSupervisor(null);
          setAddDialogOpen(true);
        }}
      />

      <SupervisorFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={() => {
          setSearchQuery("");
          setStatusFilter("all");
        }}
      />

      <SupervisorTable
        supervisors={filtered}
        loading={loading}
        onEditSupervisor={(supervisor) => {
          setEditingSupervisor(supervisor);
          setAddDialogOpen(true);
        }}
        onDeleteSupervisor={handleDeleteSupervisor}
      />

      <AddSupervisorDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAddSupervisor={handleAddSupervisor}
        onUpdateSupervisor={handleUpdateSupervisor}
        editingSupervisor={editingSupervisor}
      />
    </div>
  );
}

export default SupervisorsPage;
