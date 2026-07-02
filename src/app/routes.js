import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import { ShipmentList } from "./components/shipments/ShipmentList";
import { TripTrackingPage } from "./components/trips/TripTrackingPage";
import { VehicleTrackingPage } from "./components/vehicle-tracking/VehicleTrackingPage";
import { PlaceholderPage } from "./components/PlaceholderPage";
import { DriversPage } from "./components/drivers/DriversPage";
import { VehiclesPage } from "./components/Vechicles_Mgmt/VehiclesPage";
import { ReportsPage } from "./components/ReportsPage";
import { ExpensesPage } from "./components/expenses/ExpensesPage";
import { InvoicesPage } from "./components/invoices/InvoicesPage";
import { SettingsPage } from "./components/settings/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "shipments", Component: ShipmentList },
      { path: "trips", Component: TripTrackingPage },
      { path: "tracking/:vehicleId", Component: VehicleTrackingPage },
      { path: "diesel", Component: PlaceholderPage },
      { path: "vehicles", Component: VehiclesPage },
      { path: "drivers", Component: DriversPage },
      { path: "reports", Component: ReportsPage },
      { path: "invoices", Component: InvoicesPage },
      { path: "expenses", Component: ExpensesPage },
      { path: "settings", Component: SettingsPage },
      { path: "*", Component: PlaceholderPage },
    ],
  },
]);
