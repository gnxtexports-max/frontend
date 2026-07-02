import { Button } from "../ui/button";
import { useAuth } from "../../context/AuthContext";

function PlusIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function HistoryIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <polyline points="3 3 3 8 8 8" />
      <line x1="12" y1="7" x2="12" y2="12" />
      <line x1="12" y1="12" x2="16" y2="14" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function ShipmentHeader({ total, onCreateClick, onHistoryClick, onExport }) {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("Shipments", "create");

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-foreground tracking-tight">Shipment Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and manage all tyre distribution shipments
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={onHistoryClick} variant="outline" className="gap-2 border-border text-foreground hover:bg-muted/60 cursor-pointer">
          <HistoryIcon />
          Shipment History
        </Button>

        {canCreate && (
          <Button onClick={onCreateClick} className="gap-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white shadow-sm cursor-pointer">
            <PlusIcon />
            Create Shipment
          </Button>
        )}
      </div>
    </div>
  );
}

export default ShipmentHeader;