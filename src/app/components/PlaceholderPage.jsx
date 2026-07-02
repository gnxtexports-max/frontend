import { useLocation } from "react-router";
import {
  LayoutDashboard,
  MapPin,
  Fuel,
  Car,
  Users,
  FileBarChart,
  Settings,
  HelpCircle,
  Construction,
} from "lucide-react";

const pageConfig = {
  "/": {
    title: "Dashboard",
    description:
      "KPI cards, delivery charts, and recent trip summaries will appear here.",
    icon: <LayoutDashboard className="w-8 h-8" />,
  },
  "/trips": {
    title: "Trip Tracking",
    description:
      "Visual timeline progress, KM/efficiency metrics, and delivery proof uploads.",
    icon: <MapPin className="w-8 h-8" />,
  },
  "/diesel": {
    title: "Diesel Tracking",
    description: "Fuel consumption logs, cost tracking, and mileage analytics.",
    icon: <Fuel className="w-8 h-8" />,
  },
  "/vehicles": {
    title: "Vehicle Management",
    description:
      "Fleet overview with details for Own, Rented, and Contract vehicles.",
    icon: <Car className="w-8 h-8" />,
  },
  "/drivers": {
    title: "Driver Management",
    description: "Driver roster, assignment status, and performance records.",
    icon: <Users className="w-8 h-8" />,
  },
  "/reports": {
    title: "Reports",
    description: "Date range filters, tabbed reports, and Excel/PDF export.",
    icon: <FileBarChart className="w-8 h-8" />,
  },
  "/settings": {
    title: "Settings",
    description: "System configuration, user management, and preferences.",
    icon: <Settings className="w-8 h-8" />,
  },
  "/help": {
    title: "Help & Support",
    description: "Documentation, FAQs, and support ticket management.",
    icon: <HelpCircle className="w-8 h-8" />,
  },
};

export function PlaceholderPage() {
  const location = useLocation();
  const config = pageConfig[location.pathname] || {
    title: "Page Not Found",
    description: "The requested page could not be found.",
    icon: <Construction className="w-8 h-8" />,
  };

  return (
    
    <div className="h-full flex items-center justify-center p-8">
 
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[#eef2ff] border border-[#c7d7fe] flex items-center justify-center mx-auto mb-5 text-[#4338ca]">
          {config.icon}
        </div>
        <h2 className="text-foreground tracking-tight">{config.title}</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          {config.description}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
          <Construction className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs text-amber-700">
            Module under development
          </span>
        </div>
      </div>
    </div>
  );
}
