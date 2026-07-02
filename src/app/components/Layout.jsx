import { useState, useEffect, Suspense } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Truck,
  Package,
  Users,
  Car,
  FileBarChart,
  Settings,
  ChevronDown,
  MapPin,
  HelpCircle,
  LogOut,
  User,
  ChevronRight,
  Wallet,
  ReceiptText,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useOfflineSync } from "../context/OfflineSyncContext";
import { useBackendHealth } from "../context/BackendHealthContext";
import { LoginPage } from "./auth/LoginPage";
import { ProfileModal } from "./auth/ProfileModal";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";


const navSections = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
        href: "/",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Shipments",
        icon: <Package className="w-[18px] h-[18px]" />,
        href: "/shipments",
        badgeKey: "shipments",
        badgeColor: "bg-blue-100 text-blue-700",
      },
      {
        label: "Trip Tracking",
        icon: <MapPin className="w-[18px] h-[18px]" />,
        href: "/trips",
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Invoices",
        icon: <ReceiptText className="w-[18px] h-[18px]" />,
        href: "/invoices",
      },
      {
        label: "Expenses",
        icon: <Wallet className="w-[18px] h-[18px]" />,
        href: "/expenses",
      },
    ],
  },
  {
    title: "Fleet Management",
    items: [
      {
        label: "Vehicles",
        icon: <Car className="w-[18px] h-[18px]" />,
        href: "/vehicles",
      },
      {
        label: "Drivers",
        icon: <Users className="w-[18px] h-[18px]" />,
        href: "/drivers",
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        label: "Reports",
        icon: <FileBarChart className="w-[18px] h-[18px]" />,
        href: "/reports",
      },
    ],
  },
];

const bottomNavItems = [
  {
    label: "Settings",
    icon: <Settings className="w-[18px] h-[18px]" />,
    href: "/settings",
  },
  {
    label: "Help & Support",
    icon: <HelpCircle className="w-[18px] h-[18px]" />,
    href: "/help",
  },
];

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

export function Layout() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  // Offline sync and backend health — logic is active in context; no UI badge displayed
  useOfflineSync();
  useBackendHealth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeShipmentsCount, setActiveShipmentsCount] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

  // Fetch active shipment count (Pending + In Transit) for the sidebar badge
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const [pendingRes, inTransitRes] = await Promise.all([
          fetch(`${API_BASE}/shipments?status=Pending&limit=1`),
          fetch(`${API_BASE}/shipments?status=${encodeURIComponent("In Transit")}&limit=1`),
        ]);
        const [pending, inTransit] = await Promise.all([
          pendingRes.json(),
          inTransitRes.json(),
        ]);
        const count =
          (pending.pagination?.total || 0) +
          (inTransit.pagination?.total || 0);
        setActiveShipmentsCount(count);
      } catch {
        // silently fail — badge just won't show
      }
    };
    fetchCount();
    // Refresh every 7 min; real-time updates via socket events
    const interval = setInterval(fetchCount, 420_000);
    return () => clearInterval(interval);
  }, []);

  const hasViewPermission = (moduleName) => {
    if (user?.role === "Super Admin") return true;
    if (!user?.permissions) return false;
    const perm = user.permissions.find(p => p.module === moduleName);
    return perm ? perm.view : false;
  };

  const getRequiredPermissionForPath = (path) => {
    if (path === "/") return "Dashboard";
    if (path.startsWith("/shipments")) return "Shipments";
    if (path.startsWith("/trips") || path.startsWith("/tracking/")) return "Trip Tracking";
    if (path.startsWith("/invoices")) return "Invoices";
    if (path.startsWith("/expenses")) return "Expenses";
    if (path.startsWith("/vehicles")) return "Vehicles";
    if (path.startsWith("/drivers")) return "Drivers";
    if (path.startsWith("/reports")) return "Reports";
    if (path.startsWith("/help")) return "Help & Support";
    if (path.startsWith("/settings")) return "Settings";
    return null;
  };

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;
    if (user.role === "Super Admin") return;

    const currentModule = getRequiredPermissionForPath(location.pathname);
    if (!currentModule) return;
    if (currentModule === "Settings") {
      if (!hasViewPermission("Settings")) {
        navigate("/", { replace: true });
      }
      return;
    }
    if (!hasViewPermission(currentModule)) {
      const firstPage = REDIRECT_PAGES.find(p => hasViewPermission(p.perm));
      if (firstPage) {
        navigate(firstPage.path, { replace: true });
      } else {
        navigate("/settings", { replace: true });
      }
    }
  }, [location.pathname, user, loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0f172a] gap-4">
        <Loader2 className="w-10 h-10 text-[#1d4ed8] animate-spin" />
        <span className="text-white/60 text-sm animate-pulse tracking-wide font-medium">Validating session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Determine page title from current route
  const getPageTitle = () => {
    const allItems = [
      ...navSections.flatMap((s) => s.items),
      ...bottomNavItems,
    ];
    const current = allItems.find((item) => {
      if (item.href === "/") return location.pathname === "/";
      return location.pathname.startsWith(item.href);
    });
    return current?.label || "Dashboard";
  };

  // Breadcrumb
  const getBreadcrumb = () => {
    const sectionMatch = navSections.find((s) =>
      s.items.some((item) => {
        if (item.href === "/") return location.pathname === "/";
        return location.pathname.startsWith(item.href);
      }),
    );
    return sectionMatch?.title || "Overview";
  };

  return (
    <TooltipProvider>
      <div className="h-screen flex overflow-hidden bg-background">
        {/* ── SIDEBAR ─────────────────────────── */}
        <aside
          className={`${sidebarCollapsed ? "w-16" : "w-64"}
  h-full bg-white border-r border-border flex flex-col shrink-0  transition-all duration-300 ease-in-out`}
        >
          {/* Logo / Brand */}
          <div
            className={`relative h-[60px] flex items-center px-3 border-b border-border shrink-0
  ${sidebarCollapsed ? "justify-center" : "justify-between"}`}
          >
            {/* Logo */}
            <div
              onClick={() => {
                if (sidebarCollapsed) setSidebarCollapsed(false);
              }}
              className={`flex items-center cursor-pointer
    ${sidebarCollapsed ? "justify-center w-full" : "gap-3"}`}
            >
              {/* Icon */}
              <div className="w-8 h-8 rounded-lg bg-[#1d4ed8] flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-white" />
              </div>

              {/* Text (only when expanded) */}
              {!sidebarCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm text-foreground truncate tracking-tight">
                    GNXT
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Distribution Hub
                  </p>
                </div>
              )}
            </div>


            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition"
              >
                <ChevronRight className="w-4 h-4 rotate-180 transition-transform duration-300" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scroll-smooth">
            {navSections.map((section) => {
              const visibleItems = section.items.filter(item => hasViewPermission(item.label));
              if (visibleItems.length === 0) return null;

              return (
                <div key={section.title}>
                  {!sidebarCollapsed && (
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest px-3 mb-2">
                      {section.title}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => (
                      <SidebarLink
                        key={item.href}
                        item={item}
                        collapsed={sidebarCollapsed}
                        badges={{ shipments: activeShipmentsCount }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Bottom Nav */}
          <div className="border-t border-border px-3 py-3 space-y-0.5 shrink-0">
            {bottomNavItems.map((item) => {
              if (item.label === "Settings" && user?.role !== "Super Admin") return null;
              if (item.label !== "Settings" && !hasViewPermission(item.label)) return null;
              return (
                <SidebarLink
                  key={item.href}
                  item={item}
                  collapsed={sidebarCollapsed}
                />
              );
            })}
          </div>

          {/* Collapse Toggle */}
          <div className="border-t border-border px-3 py-2.5 shrink-0">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? "rotate-180" : ""
                  }`}
              />
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA ───────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Bar */}
          <header className="h-[60px] bg-white border-b border-border flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">{getBreadcrumb()}</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                <span className="text-foreground">{getPageTitle()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 hover:bg-muted/60 rounded-lg px-2 py-1.5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#7c3aed] flex items-center justify-center">
                      <span className="text-xs text-white uppercase font-bold">
                        {user?.avatar || user?.username?.slice(0, 2)?.toUpperCase() || "US"}
                      </span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs text-foreground font-medium capitalize">{user?.username}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {user?.role || "Logistics Staff"}
                      </p>
                    </div>
                    <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setProfileModalOpen(true)}>
                    <User className="w-3.5 h-3.5" />
                    My Profile
                  </DropdownMenuItem>
                  {user?.role === "Super Admin" && (
                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/settings")}>
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600 cursor-pointer" onClick={logout}>
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto relative">
            <Suspense fallback={
              <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50/50 gap-3">
                <Loader2 className="w-8 h-8 text-[#1d4ed8] animate-spin" />
                <span className="text-muted-foreground text-sm tracking-wide font-medium">Loading Page...</span>
              </div>
            }>
              <Outlet />
            </Suspense>

            <ProfileModal
              isOpen={profileModalOpen}
              onClose={() => setProfileModalOpen(false)}
              user={user}
            />

            {/* Floating Create Now Button */}
            {location.pathname !== "/shipments" && (
              <Tooltip>
                <TooltipTrigger asChild></TooltipTrigger>
                <TooltipContent side="left">Create New Shipment</TooltipContent>
              </Tooltip>
            )}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ── Sidebar Link Sub-component ─────────────── */

function SidebarLink({ item, collapsed, badges = {} }) {
  // Resolve badge value: static badge string or dynamic via badgeKey
  const badgeValue = item.badge ?? (item.badgeKey ? badges[item.badgeKey] : null);
  const showBadge = badgeValue !== null && badgeValue !== undefined && badgeValue !== 0;

  const content = (
    <NavLink
      to={item.href}
      end={item.href === "/"}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm transition-colors ${isActive
          ? "bg-[#eef2ff] text-[#1d4ed8]"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        } ${collapsed ? "justify-center px-0" : ""}`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`shrink-0 ${isActive ? "text-[#1d4ed8]" : ""}`}>
            {item.icon}
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {showBadge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${item.badgeColor || "bg-muted text-muted-foreground"
                    }`}
                >
                  {badgeValue}
                </span>
              )}
            </>
          )}
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
