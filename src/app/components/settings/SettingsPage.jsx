import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import {
  Users as UsersIcon,
  History,
  Search,
  Plus,
  MoreVertical,
  Edit2,
  KeyRound,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  ShieldAlert,
  Building,
  Loader2,
  AlertCircle,
  LayoutDashboard,
  Package,
  MapPin,
  FileText,
  DollarSign,
  Truck,
  UserCheck,
  BarChart2,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Lock,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";

const API = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

// Module definitions with granular permissions
const MODULE_PERMISSIONS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "Access to the main dashboard overview",
    permissions: [
      { key: "view_dashboard", label: "View Dashboard" },
    ],
    fullAccess: true, // single toggle module
  },
  {
    key: "shipments",
    label: "Shipments",
    icon: Package,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    description: "Manage shipments and delivery operations",
    permissions: [
      { key: "view_shipments", label: "View Shipments" },
      { key: "view_shipments_history", label: "Shipments History" },
      { key: "create_shipment", label: "Create Shipment" },
      { key: "edit_shipment", label: "Edit Shipment" },
    ],
  },
  {
    key: "trip_tracking",
    label: "Trip Tracking",
    icon: MapPin,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    description: "Track and manage active trips",
    permissions: [
      { key: "view_trips", label: "View Trips" },
      { key: "update_trip_status", label: "Update Trip Status" },
    ],
  },
  {
    key: "invoices",
    label: "Invoices",
    icon: FileText,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    description: "Handle billing and invoice management",
    permissions: [
      { key: "view_invoices", label: "View Invoices & History" },
      { key: "upload_invoice_sheet", label: "Upload Sheet" },
      { key: "add_invoice", label: "Add Invoice" },
      { key: "cancel_invoice", label: "Cancel Invoice" },
    ],
  },
  {
    key: "expenses",
    label: "Expenses",
    icon: DollarSign,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    description: "Track and manage expense records",
    permissions: [
      { key: "view_expenses", label: "View Expenses" },
      { key: "add_expense", label: "Add Expense" },
      { key: "export_expense_excel", label: "Export Expense Excel" },
      { key: "edit_expenses", label: "Edit Expenses" },
    ],
  },
  {
    key: "vehicles",
    label: "Vehicles",
    icon: Truck,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    description: "Vehicle fleet management",
    permissions: [
      { key: "view_vehicles", label: "View Vehicles" },
      { key: "add_edit_vehicles", label: "Add / Edit Vehicles" },
    ],
  },
  {
    key: "drivers",
    label: "Drivers",
    icon: UserCheck,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    description: "Driver profile and assignment management",
    permissions: [
      { key: "view_drivers", label: "View Drivers" },
      { key: "add_edit_drivers", label: "Add / Edit Drivers" },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    icon: BarChart2,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    description: "Analytics and reporting tools",
    permissions: [
      { key: "view_reports", label: "View Reports" },
      { key: "export_reports", label: "Export Reports" },
    ],
  },
  {
    key: "help_support",
    label: "Help & Support",
    icon: HelpCircle,
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    description: "Access to help center and support tickets",
    permissions: [
      { key: "view_help_support", label: "View Help & Support" },
    ],
    fullAccess: true,
  },
];

const ROLES = [
  { name: "Super Admin", desc: "Full system access including user management" },
  { name: "Sub Admin", desc: "Manually configured administrative access" },
  { name: "Billing Executive (Invoice Operator)", desc: "Manage billing and invoices" },
  { name: "Operations Supervisor", desc: "Manage logistics and vehicle operations" },
  { name: "Accounts Executive", desc: "Manage financial data and reporting" },
];

// Build default permissions object for a role
const buildDefaultPermissions = (roleName) => {
  const isAdmin = roleName === "Super Admin";
  const perms = {};
  MODULE_PERMISSIONS.forEach((mod) => {
    mod.permissions.forEach((p) => {
      perms[p.key] = isAdmin;
    });
  });
  return perms;
};

const mapLegacyToGranular = (legacyPerms, roleName) => {
  const isAdmin = roleName === "Super Admin";
  const perms = {};
  MODULE_PERMISSIONS.forEach((mod) => {
    mod.permissions.forEach((p) => {
      perms[p.key] = isAdmin;
    });
  });

  if (isAdmin) return perms;
  if (!legacyPerms || !Array.isArray(legacyPerms)) return perms;

  legacyPerms.forEach((lp) => {
    const modName = lp.module?.toLowerCase()?.trim();
    if (modName === "dashboard") {
      perms["view_dashboard"] = lp.view;
    } else if (modName === "shipments" || modName === "shipments & lr management") {
      perms["view_shipments"] = lp.view;
      perms["view_shipments_history"] = lp.view;
      perms["create_shipment"] = lp.create;
      perms["edit_shipment"] = lp.edit;
    } else if (modName === "trip tracking" || modName === "fleet & vehicle tracking") {
      perms["view_trips"] = lp.view;
      perms["update_trip_status"] = lp.edit;
    } else if (modName === "invoices" || modName === "invoice & finance") {
      perms["view_invoices"] = lp.view;
      perms["upload_invoice_sheet"] = lp.create;
      perms["add_invoice"] = lp.create;
      perms["cancel_invoice"] = lp.delete;
    } else if (modName === "expenses") {
      perms["view_expenses"] = lp.view;
      perms["add_expense"] = lp.create;
      perms["export_expense_excel"] = lp.create || lp.view;
      perms["edit_expenses"] = lp.edit;
    } else if (modName === "vehicles") {
      perms["view_vehicles"] = lp.view;
      perms["add_edit_vehicles"] = lp.edit;
    } else if (modName === "drivers") {
      perms["view_drivers"] = lp.view;
      perms["add_edit_drivers"] = lp.edit;
    } else if (modName === "reports" || modName === "reports & analytics") {
      perms["view_reports"] = lp.view;
      perms["export_reports"] = lp.edit || lp.view;
    } else if (modName === "help & support") {
      perms["view_help_support"] = lp.view;
    }
  });

  return perms;
};

// Ordered fallback redirect pages for non-admin users
const REDIRECT_PAGES = [
  { perm: "Dashboard",    path: "/" },
  { perm: "Shipments",    path: "/shipments" },
  { perm: "Trip Tracking",path: "/trips" },
  { perm: "Invoices",     path: "/invoices" },
  { perm: "Expenses",     path: "/expenses" },
  { perm: "Vehicles",     path: "/vehicles" },
  { perm: "Drivers",      path: "/drivers" },
  { perm: "Reports",      path: "/reports" },
  { perm: "Help & Support",path: "/help" },
];

export function SettingsPage() {
  const { user: currentUser, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Activity Log State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Activity Log Filters
  const [logDateFilter, setLogDateFilter] = useState("all");
  const [logCustomDate, setLogCustomDate] = useState("");
  const [logActionFilter, setLogActionFilter] = useState("all");

  // Permissions state
  const [selectedRole, setSelectedRole] = useState("Billing Executive (Invoice Operator)");
  const [rolePermissions, setRolePermissions] = useState({});
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  const [permissionNotification, setPermissionNotification] = useState(null);

  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // Password reset state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "Billing Executive (Invoice Operator)",
    branch: "Mumbai Hub",
  });
  const [formError, setFormError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const getFilteredLogs = () => {
    return logs.filter((log) => {
      if (logActionFilter === "login") {
        const isLoginAction =
          log.action === "Login" ||
          log.action === "Failed Login" ||
          log.action?.toLowerCase().includes("login");
        if (!isLoginAction) return false;
      }
      if (logDateFilter === "all") return true;
      const logDate = new Date(log.createdAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const isSameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
      if (logDateFilter === "today") return isSameDay(logDate, today);
      if (logDateFilter === "yesterday") return isSameDay(logDate, yesterday);
      if (logDateFilter === "custom") {
        if (!logCustomDate) return true;
        const targetDate = new Date(logCustomDate);
        return isSameDay(logDate, targetDate);
      }
      return true;
    });
  };

  useEffect(() => {
    if (currentUser?.role === "Super Admin") {
      fetchUsers();
      fetchLogs();
    }
  }, [token, currentUser]);

  // Initialize expanded state - all modules expanded by default
  useEffect(() => {
    const init = {};
    MODULE_PERMISSIONS.forEach((m) => { init[m.key] = true; });
    setExpandedModules(init);
  }, []);

  // Settings page is Super Admin only - Layout.jsx handles redirect for non-admins
  if (currentUser?.role !== "Super Admin") return null;

  const initializePermissions = (fetchedUsers, roleTemplates = {}) => {
    const defaultPerms = {};
    ROLES.forEach((role) => {
      // 1. Try a real user with this role first
      const existingUser = fetchedUsers.find(
        (u) =>
          u.role === role.name &&
          ((u.granularPermissions && Object.keys(u.granularPermissions).length > 0) ||
            (u.permissions && u.permissions.length > 0))
      );
      if (existingUser) {
        if (existingUser.granularPermissions && Object.keys(existingUser.granularPermissions).length > 0) {
          defaultPerms[role.name] = { ...existingUser.granularPermissions };
        } else if (existingUser.permissions && existingUser.permissions.length > 0) {
          defaultPerms[role.name] = mapLegacyToGranular(existingUser.permissions, role.name);
        } else {
          defaultPerms[role.name] = buildDefaultPermissions(role.name);
        }
      } else if (roleTemplates[role.name]) {
        // 2. Fall back to saved template (fresh system / no users for this role yet)
        const t = roleTemplates[role.name];
        if (t.granularPermissions && Object.keys(t.granularPermissions).length > 0) {
          defaultPerms[role.name] = { ...t.granularPermissions };
        } else if (t.permissions && t.permissions.length > 0) {
          defaultPerms[role.name] = mapLegacyToGranular(t.permissions, role.name);
        } else {
          defaultPerms[role.name] = buildDefaultPermissions(role.name);
        }
      } else {
        // 3. Brand-new role — use built-in defaults
        defaultPerms[role.name] = buildDefaultPermissions(role.name);
      }
    });
    setRolePermissions(defaultPerms);
  };

  // Live refresh on socket cache update
  useEffect(() => {
    const handler = () => { fetchUsers(); fetchLogs(); };
    window.addEventListener("api-cache-updated", handler);
    return () => window.removeEventListener("api-cache-updated", handler);
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch real users and role templates in parallel
      const [usersRes, templatesRes] = await Promise.all([
        fetch(`${API}/users`, { credentials: "include" }),
        fetch(`${API}/users/role-templates`, { credentials: "include" }),
      ]);
      const [usersData, templatesData] = await Promise.all([
        usersRes.json(),
        templatesRes.json(),
      ]);
      if (usersData.success) {
        setUsers(usersData.data);
        initializePermissions(usersData.data, templatesData.success ? templatesData.data : {});
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`${API}/users/activity-log`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOpenAddUser = () => {
    setIsEditing(false);
    setEditingUserId(null);
    setFormData({ username: "", email: "", password: "", role: "Billing Executive (Invoice Operator)", branch: "Mumbai Hub" });
    setFormError("");
    setUserDialogOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setIsEditing(true);
    setEditingUserId(user._id);
    setFormData({ username: user.username, email: user.email, password: "", role: user.role, branch: user.branch || "Mumbai Hub" });
    setFormError("");
    setUserDialogOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError("");
    setActionLoading(true);
    if (currentUser?.role !== "Super Admin") {
      setFormError("Only Super Admins can add or edit users.");
      setActionLoading(false);
      return;
    }
    try {
      const url = isEditing ? `${API}/users/${editingUserId}` : `${API}/users`;
      const method = isEditing ? "PUT" : "POST";
      const body = { ...formData };
      if (isEditing) delete body.password;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setUserDialogOpen(false);
        fetchUsers();
        fetchLogs();
      } else {
        setFormError(data.message || "Failed to save user");
      }
    } catch (err) {
      setFormError("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch(`${API}/users/${user._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map((u) => (u._id === user._id ? { ...u, status: newStatus } : u)));
        fetchLogs();
      }
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    if (newPassword.length < 6) { setResetError("Password must be at least 6 characters."); return; }
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/users/${resetUserId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (data.success) { setResetDialogOpen(false); setNewPassword(""); fetchLogs(); }
      else setResetError(data.message || "Failed to reset password");
    } catch (err) {
      setResetError("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user._id === currentUser?.id) { alert("You cannot delete your own account."); return; }
    if (!window.confirm(`Are you sure you want to delete user "${user.username}"?`)) return;
    try {
      const res = await fetch(`${API}/users/${user._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) { fetchUsers(); fetchLogs(); }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // Granular permission toggle
  const handlePermissionToggle = (permKey, value) => {
    if (selectedRole === "Super Admin") return;
    setRolePermissions((prev) => ({
      ...prev,
      [selectedRole]: { ...prev[selectedRole], [permKey]: value },
    }));
  };

  // Toggle all permissions for a module
  const handleModuleToggleAll = (mod, value) => {
    if (selectedRole === "Super Admin") return;
    setRolePermissions((prev) => {
      const updated = { ...prev[selectedRole] };
      mod.permissions.forEach((p) => { updated[p.key] = value; });
      return { ...prev, [selectedRole]: updated };
    });
  };

  // Check if all permissions in a module are enabled
  const isModuleAllEnabled = (mod) => {
    const perms = rolePermissions[selectedRole] || {};
    return mod.permissions.every((p) => perms[p.key]);
  };

  // Check if any permission in a module is enabled
  const isModulePartiallyEnabled = (mod) => {
    const perms = rolePermissions[selectedRole] || {};
    const enabled = mod.permissions.filter((p) => perms[p.key]).length;
    return enabled > 0 && enabled < mod.permissions.length;
  };

  // Toggle module expand/collapse
  const toggleModule = (key) => {
    setExpandedModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePermissions = async () => {
    setSavingPermissions(true);
    const targetPerms = rolePermissions[selectedRole];

    // Convert granular permissions to the legacy format for backward compat
    const legacyPerms = MODULE_PERMISSIONS.map((mod) => ({
      module: mod.label,
      view: mod.permissions.some((p) => p.key.startsWith("view_") && targetPerms[p.key]),
      create: mod.permissions.some((p) => (p.key.startsWith("create_") || p.key.startsWith("add_") || p.key.startsWith("upload_")) && targetPerms[p.key]),
      edit: mod.permissions.some((p) => (p.key.startsWith("edit_") || p.key.startsWith("update_") || p.key.startsWith("add_edit_")) && targetPerms[p.key]),
      delete: mod.permissions.some((p) => p.key.startsWith("cancel_") && targetPerms[p.key]),
    }));

    try {
      const res = await fetch(`${API}/users/role/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: selectedRole, permissions: legacyPerms, granularPermissions: targetPerms }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to update permissions");
      }
      await fetchUsers();
      fetchLogs();
      setPermissionNotification({ type: "success", message: "Permissions updated successfully for this role." });
      setTimeout(() => setPermissionNotification(null), 3000);
    } catch (err) {
      console.error("Error updating permissions:", err);
      setPermissionNotification({ type: "error", message: err.message || "Failed to update permissions." });
      setTimeout(() => setPermissionNotification(null), 4000);
    } finally {
      setSavingPermissions(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentPerms = rolePermissions[selectedRole] || {};
  const totalPermsCount = MODULE_PERMISSIONS.reduce((acc, m) => acc + m.permissions.length, 0);
  const enabledPermsCount = Object.values(currentPerms).filter(Boolean).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">User & Role Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage system access, configure roles, and monitor user activities across branches.
          </p>
        </div>
        {activeTab === "users" && currentUser?.role === "Super Admin" && (
          <Button onClick={handleOpenAddUser} className="bg-[#1d4ed8] hover:bg-blue-800 text-white gap-2 h-10 px-4 rounded-xl shadow-sm transition-all duration-200">
            <Plus className="w-4 h-4" />
            New User
          </Button>
        )}
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex border-b border-slate-200 gap-6">
        {[
          { key: "users", icon: UsersIcon, label: "Users" },
          { key: "permissions", icon: ShieldAlert, label: "Roles & Permissions" },
          { key: "logs", icon: History, label: "Activity Log" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-medium tracking-wide border-b-2 transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? "border-[#1d4ed8] text-[#1d4ed8]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT: USERS ── */}
      {activeTab === "users" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-slate-900">System Users</h2>
              <p className="text-xs text-slate-500">Manage user accounts, statuses, and branch assignments.</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-sm"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[#1d4ed8] animate-spin" />
              <span className="text-slate-400 text-sm">Loading users...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-12">User</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-12">Role & Branch</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-12">Last Login</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-12">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-12 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-slate-400 text-sm">No users found.</TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user._id} className="hover:bg-slate-50/40 border-b border-slate-100/80">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm text-white font-bold text-sm uppercase">
                            {user.avatar || user.username?.slice(0, 2)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 capitalize">{user.username}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium">
                            <Shield className="w-3.5 h-3.5 text-[#1d4ed8]" />
                            {user.role}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Building className="w-3.5 h-3.5" />
                            {user.branch || "All Branches"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.status === "Active"}
                            disabled={currentUser?.role !== "Super Admin" || user._id === currentUser?.id}
                            onCheckedChange={() => handleToggleStatus(user)}
                          />
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-50 text-slate-500 border border-slate-200"}`}>
                            {user.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {currentUser?.role === "Super Admin" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                                <MoreVertical className="h-4 w-4 text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl border border-slate-100 shadow-lg">
                              <DropdownMenuItem onClick={() => handleOpenEditUser(user)} className="gap-2 text-slate-700 cursor-pointer py-2 rounded-lg">
                                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => { setResetUserId(user._id); setNewPassword(""); setResetError(""); setResetDialogOpen(true); }}
                                className="gap-2 text-slate-700 cursor-pointer py-2 rounded-lg"
                              >
                                <KeyRound className="w-3.5 h-3.5" /> Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="border-slate-100" />
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user)}
                                disabled={user._id === currentUser?.id}
                                className="gap-2 text-red-600 focus:text-red-700 cursor-pointer py-2 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-xs text-slate-400">Read-only</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* ── TAB CONTENT: ROLES & PERMISSIONS ── */}
      {activeTab === "permissions" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: Role Selector */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">Select Role</h3>
                <p className="text-xs text-slate-500 mt-1">Choose a role to configure its access rights.</p>
              </div>
              <div className="space-y-2">
                {ROLES.map((role) => {
                  const isSuper = role.name === "Super Admin";
                  return (
                    <button
                      key={role.name}
                      onClick={() => !isSuper && setSelectedRole(role.name)}
                      disabled={isSuper}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                        selectedRole === role.name && !isSuper
                          ? "border-[#1d4ed8] bg-blue-50/40 shadow-sm"
                          : isSuper
                          ? "border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed"
                          : "border-slate-100 hover:border-slate-200 bg-slate-50/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-900">{role.name}</span>
                        {isSuper ? (
                          <div className="flex items-center gap-1.5">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Full Access</span>
                          </div>
                        ) : selectedRole === role.name ? (
                          <span className="text-[10px] font-semibold bg-[#1d4ed8] text-white px-2 py-0.5 rounded-full">Active</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{role.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permission Summary Card */}
            {selectedRole !== "Super Admin" && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Permission Summary</h4>
                <div className="space-y-2">
                  {MODULE_PERMISSIONS.map((mod) => {
                    const Icon = mod.icon;
                    const allEnabled = isModuleAllEnabled(mod);
                    const partial = isModulePartiallyEnabled(mod);
                    const enabledCount = mod.permissions.filter((p) => currentPerms[p.key]).length;
                    return (
                      <div key={mod.key} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${mod.bgColor}`}>
                            <Icon className={`w-3.5 h-3.5 ${mod.color}`} />
                          </div>
                          <span className="text-xs text-slate-600 font-medium">{mod.label}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          allEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : partial ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : "bg-slate-50 text-slate-400 border border-slate-200"
                        }`}>
                          {allEnabled ? "Full" : partial ? `${enabledCount}/${mod.permissions.length}` : "None"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right panel: Granular Permissions */}
          <div className="lg:col-span-8 space-y-4">
            {/* Header Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">
                    Permissions — <span className="text-[#1d4ed8]">{selectedRole}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedRole === "Super Admin"
                      ? "Super Admin has full implicit access to all modules."
                      : `${enabledPermsCount} of ${totalPermsCount} permissions enabled`}
                  </p>
                </div>
                {selectedRole !== "Super Admin" && (
                  <Button
                    onClick={handleSavePermissions}
                    disabled={savingPermissions}
                    className="bg-[#1d4ed8] hover:bg-blue-800 text-white rounded-xl shadow-sm px-5 py-2 h-9 text-sm font-medium"
                  >
                    {savingPermissions ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </Button>
                )}
              </div>

              {/* Overall progress bar */}
              {selectedRole !== "Super Admin" && (
                <div className="mt-4">
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-[#1d4ed8] h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(enabledPermsCount / totalPermsCount) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Permission save notification */}
              {permissionNotification && (
                <div className={`mt-3 flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  permissionNotification.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {permissionNotification.type === "success"
                    ? <CheckCircle className="w-4 h-4 shrink-0" />
                    : <AlertCircle className="w-4 h-4 shrink-0" />
                  }
                  {permissionNotification.message}
                </div>
              )}
            </div>

            {selectedRole === "Super Admin" ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800">
                  <AlertCircle className="w-5 h-5 text-[#1d4ed8] shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">
                    Super Admin roles have implicit full access to all system modules and settings. Custom rules cannot be changed.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {MODULE_PERMISSIONS.map((mod) => {
                  const Icon = mod.icon;
                  const isExpanded = expandedModules[mod.key];
                  const allEnabled = isModuleAllEnabled(mod);
                  const partial = isModulePartiallyEnabled(mod);

                  return (
                    <div key={mod.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      {/* Module Header */}
                      <div
                        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors ${isExpanded ? "border-b border-slate-100" : ""}`}
                        onClick={() => toggleModule(mod.key)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${mod.bgColor}`}>
                            <Icon className={`w-4.5 h-4.5 ${mod.color}`} style={{ width: 18, height: 18 }} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900">{mod.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{mod.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Module-level toggle */}
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              id={`module-all-${mod.key}`}
                              checked={allEnabled}
                              className={partial ? "data-[state=checked]:bg-amber-500" : ""}
                              onCheckedChange={(val) => handleModuleToggleAll(mod, !!val)}
                            />
                            <label
                              htmlFor={`module-all-${mod.key}`}
                              className="text-xs font-medium text-slate-500 cursor-pointer select-none whitespace-nowrap"
                            >
                              {allEnabled ? "All Enabled" : partial ? "Partial" : "Enable All"}
                            </label>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Module Permissions Grid */}
                      {isExpanded && (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {mod.permissions.map((perm) => {
                            const isEnabled = currentPerms[perm.key] || false;
                            return (
                              <label
                                key={perm.key}
                                htmlFor={`perm-${perm.key}`}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 select-none ${
                                  isEnabled
                                    ? "border-[#1d4ed8]/20 bg-blue-50/30"
                                    : "border-slate-100 bg-slate-50/30 hover:bg-slate-50"
                                }`}
                              >
                                <Checkbox
                                  id={`perm-${perm.key}`}
                                  checked={isEnabled}
                                  onCheckedChange={(val) => handlePermissionToggle(perm.key, !!val)}
                                  className="shrink-0"
                                />
                                <span className={`text-sm font-medium ${isEnabled ? "text-[#1d4ed8]" : "text-slate-600"}`}>
                                  {perm.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: ACTIVITY LOG ── */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-slate-900">System Activity Log</h2>
              <p className="text-xs text-slate-500 mt-0.5">Audit trail of user actions, logins, and system events.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action Type</label>
                <select
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                >
                  <option value="all">All Actions</option>
                  <option value="login">User Login Only</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Filter</label>
                <select
                  value={logDateFilter}
                  onChange={(e) => setLogDateFilter(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="custom">Day-Based (Custom)</option>
                </select>
              </div>
              {logDateFilter === "custom" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Date</label>
                  <input
                    type="date"
                    value={logCustomDate}
                    onChange={(e) => setLogCustomDate(e.target.value)}
                    className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  />
                </div>
              )}
            </div>
          </div>

          {loadingLogs ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[#1d4ed8] animate-spin" />
              <span className="text-slate-400 text-sm">Loading activity logs...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-12">Timestamp</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-12">User</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-12">Action</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-12">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredLogs().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-slate-400 text-sm">
                      No matching activity logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredLogs().map((log) => (
                    <TableRow key={log._id} className="hover:bg-slate-50/40 border-b border-slate-100/80">
                      <TableCell className="text-sm text-slate-600 py-3.5">
                        {new Date(log.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-900 capitalize">{log.userName}</TableCell>
                      <TableCell className="py-3.5">
                        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">{log.action}</span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${log.status === "Success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                          {log.status === "Success" ? <><CheckCircle className="w-3 h-3" /> Success</> : <><XCircle className="w-3 h-3" /> Failed</>}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* ── DIALOG: ADD/EDIT USER ── */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-slate-100 p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {isEditing ? "Edit User Profile" : "Create New User"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              {isEditing ? "Modify user role, email, and branch assignments." : "Fill in the user credentials to create a new secure access account."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveUser} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
              <Input
                required id="user-username" value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. Priyasharma" className="h-10 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <Input
                required id="user-email" type="email" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="priya@tyreflow.com" className="h-10 rounded-xl"
              />
            </div>
            {!isEditing && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                <Input
                  required id="user-password" type="password" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••" className="h-10 rounded-xl"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
              <select
                id="user-role" value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
              >
                {ROLES.filter((r) => r.name !== "Super Admin").map((r) => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Branch Assign</label>
              <Input
                required id="user-branch" value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                placeholder="e.g. Mumbai Hub" className="h-10 rounded-xl"
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-100 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium">{formError}</span>
              </div>
            )}

            <DialogFooter className="gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={actionLoading} className="bg-[#1d4ed8] hover:bg-blue-800 text-white rounded-xl">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: PASSWORD RESET ── */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-slate-100 p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">Reset Account Password</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">Enter a secure, robust password for this account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
              <Input
                required id="reset-password" type="password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters" className="h-10 rounded-xl"
              />
            </div>
            {resetError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-100 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium">{resetError}</span>
              </div>
            )}
            <DialogFooter className="gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setResetDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={actionLoading} className="bg-[#1d4ed8] hover:bg-blue-800 text-white rounded-xl">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
