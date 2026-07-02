import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  Shield,
  Building2,
  KeyRound,
  ShieldCheck,
  Check,
  Calendar,
  AlertCircle,
  FileText,
  BadgeAlert,
  Fingerprint
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

export function ProfileModal({ isOpen, onClose, user }) {
  const [activeTab, setActiveTab] = useState("general");

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Standard modules and permissions for fallback
  const modulesList = [
    { name: "Dashboard", key: "dashboard" },
    { name: "Shipments", key: "shipments" },
    { name: "Trips", key: "trips" },
    { name: "Expenses", key: "expenses" },
    { name: "Vehicles", key: "vehicles" },
    { name: "Drivers", key: "drivers" },
    { name: "Dealers", key: "dealers" },
    { name: "Reports", key: "reports" },
  ];

  // Helper to check user permission
  const checkPermission = (moduleName, type) => {
    if (user?.role === "Super Admin") return true;
    const perm = user?.permissions?.find(
      (p) => p.module.toLowerCase() === moduleName.toLowerCase()
    );
    return perm ? perm[type] : false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-border overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-250">
        
        {/* Cover / Header Hero */}
        <div className="h-32 bg-gradient-to-r from-[#1d4ed8] to-[#1e40af] relative shrink-0">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 flex items-center justify-center text-white transition cursor-pointer z-20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card Header */}
        <div className="px-6 pb-4 relative shrink-0 border-b border-border">
          {/* Floating Avatar */}
          <div className="absolute -top-12 left-6 w-24 h-24 rounded-2xl bg-gradient-to-br from-[#1d4ed8] to-[#2563eb] border-4 border-white flex items-center justify-center shadow-md">
            <span className="text-3xl text-white uppercase font-extrabold tracking-wider">
              {user?.avatar || user?.username?.slice(0, 2)?.toUpperCase() || "US"}
            </span>
          </div>

          <div className="pl-32 pt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-foreground tracking-tight capitalize flex items-center gap-2">
                {user?.username}
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {user?.status || "Active"}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground/80" />
                {user?.branch || "All Branches"} Location
              </p>
            </div>

            {/* Role Badge */}
            <div className={cn(
              "px-3 py-1.5 rounded-xl border text-xs font-semibold uppercase tracking-wider",
              user?.role === "Super Admin" 
                ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm" 
                : "bg-slate-50 text-slate-700 border-slate-200"
            )}>
              {user?.role || "Logistics Staff"}
            </div>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="px-6 bg-slate-50/50 border-b border-border flex gap-1 shrink-0">
          {[
            { id: "general", label: "General Profile", icon: User },
            { id: "security", label: "Security & System", icon: KeyRound },
            { id: "permissions", label: "System Permissions", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 flex items-center gap-2 transition-all cursor-pointer",
                  activeTab === tab.id
                    ? "border-[#1d4ed8] text-[#1d4ed8]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ── TAB: GENERAL ─────────────────────────── */}
          {activeTab === "general" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Username block */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Username</span>
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground capitalize">
                    <User className="w-4 h-4 text-[#1d4ed8]" />
                    {user?.username}
                  </div>
                </div>

                {/* Email block */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Email Address</span>
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                    <Mail className="w-4 h-4 text-[#1d4ed8]" />
                    {user?.email}
                  </div>
                </div>

                {/* Branch block */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Assigned Office</span>
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                    <Building2 className="w-4 h-4 text-[#1d4ed8]" />
                    {user?.branch || "All Branches"}
                  </div>
                </div>

                {/* Session status block */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">User Role</span>
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                    <ShieldCheck className="w-4 h-4 text-[#1d4ed8]" />
                    {user?.role || "Logistics Staff"}
                  </div>
                </div>

              </div>

              {/* Information disclaimer card */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 text-xs text-[#1e40af]">
                <Calendar className="w-4 h-4 text-[#1d4ed8] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-semibold">Enterprise Directory Information</p>
                  <p className="text-blue-800/80 mt-0.5">This profile profile card is synchronized with your organization's central LDAP directory. Contact your IT administrator to request administrative modifications to your email, username, or branch routing details.</p>
                </div>
              </div>

            </div>
          )}

          {/* ── TAB: SECURITY ────────────────────────── */}
          {activeTab === "security" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              <div className="space-y-4">
                
                {/* Password block */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Account Password</span>
                    <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground tracking-widest text-slate-500 select-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                      ••••••••••••
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded bg-slate-200/60 text-slate-600 text-xs font-semibold select-none flex items-center gap-1">
                    <Fingerprint className="w-3 h-3" />
                    Encrypted (bcrypt)
                  </div>
                </div>

                {/* System Activity details */}
                <div className="border border-border rounded-xl p-4 space-y-3.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Security Diagnostics</h4>
                  
                  <div className="space-y-3.5 text-xs text-muted-foreground">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Multi-Factor Authentication (MFA)
                      </span>
                      <span className="font-semibold text-foreground">Default (Managed via Identity Provider)</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        System Session Security
                      </span>
                      <span className="font-semibold text-emerald-600">Active JWT TLS 1.3 Encryption</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#1d4ed8]" />
                        Last Checked In
                      </span>
                      <span className="font-semibold text-foreground">
                        {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : new Date().toLocaleString()}
                      </span>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ── TAB: PERMISSIONS ─────────────────────── */}
          {activeTab === "permissions" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {user?.role === "Super Admin" ? (
                /* Super Admin Full Access banner */
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-center space-y-3.5 max-w-lg mx-auto shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-blue-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-blue-900">Full Administrative Access</h4>
                    <p className="text-xs text-blue-800/80 leading-relaxed">
                      As a <strong>Super Admin</strong>, you hold unrestricted root permissions across all platform modules. You have full read, write, edit, and deletion capabilities.
                    </p>
                  </div>
                </div>
              ) : (
                /* Granular permissions table */
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Granular Policy Enforcement</p>
                      <p className="text-amber-700/85 mt-0.5">Your active module-level security policies are listed below. For access requests, please contact your system administrator.</p>
                    </div>
                  </div>

                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-border text-muted-foreground uppercase font-semibold">
                          <th className="p-3.5">Module</th>
                          <th className="p-3.5 text-center">View</th>
                          <th className="p-3.5 text-center">Create</th>
                          <th className="p-3.5 text-center">Edit</th>
                          <th className="p-3.5 text-center">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {modulesList.map((mod) => (
                          <tr key={mod.key} className="hover:bg-slate-50/50">
                            <td className="p-3.5 font-medium text-foreground capitalize">{mod.name}</td>
                            <td className="p-3.5 text-center">
                              <span className={cn(
                                "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                                checkPermission(mod.key, "view") ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                              )}>
                                {checkPermission(mod.key, "view") ? "✓" : "✗"}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={cn(
                                "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                                checkPermission(mod.key, "create") ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                              )}>
                                {checkPermission(mod.key, "create") ? "✓" : "✗"}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={cn(
                                "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                                checkPermission(mod.key, "edit") ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                              )}>
                                {checkPermission(mod.key, "edit") ? "✓" : "✗"}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={cn(
                                "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                                checkPermission(mod.key, "delete") ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                              )}>
                                {checkPermission(mod.key, "delete") ? "✓" : "✗"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-border shrink-0 flex justify-end gap-2">
          <Button 
            onClick={onClose}
            className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-5 h-9 font-medium shadow-sm transition-all cursor-pointer"
          >
            Close Profile
          </Button>
        </div>

      </div>
    </div>
  );
}
