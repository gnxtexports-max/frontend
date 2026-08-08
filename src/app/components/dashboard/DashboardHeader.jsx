import { CalendarDays, X } from "lucide-react";
import { Button } from "../ui/button";

export function DashboardHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your daily shipments and delivery performance.</p>
      </div>
    </div>
  );
}
export default DashboardHeader;
