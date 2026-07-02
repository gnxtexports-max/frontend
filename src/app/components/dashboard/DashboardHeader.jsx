import { CalendarDays, TrendingUp } from "lucide-react";
import { Button } from "../ui/button";

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your daily shipments and delivery performance.</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="bg-white"><CalendarDays className="w-4 h-4 mr-2" />Last 7 Days</Button>
       
      </div>
    </div>
  );
}
export default DashboardHeader;
