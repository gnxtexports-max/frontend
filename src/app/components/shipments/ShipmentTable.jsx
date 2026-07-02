import { Loader2, Truck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import PlantRow from "./ShipmentRow";

export function ShipmentTable({
  filteredShipments,
  loading,
  setSelectedShipment,
  setViewSheetOpen,
  setEditShipment,
  shipmentData,
  setShipmentData,
  onDeleted,
}) {
  return (
    <div className="bg-white rounded-lg border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-[#fafbfc]">
              <TableHead className="pl-5 w-[160px]">Shipment ID</TableHead>
              <TableHead className="w-[140px]">Plant Number</TableHead>
              <TableHead className="w-[220px]">Dealer & Location</TableHead>
              <TableHead className="w-[150px]">Items & Weight</TableHead>
              <TableHead className="w-[160px]">Driver Info</TableHead>
              <TableHead className="w-[160px]">Vehicle Info</TableHead>
              <TableHead className="w-[110px]">Date</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[110px]">POD</TableHead>
              <TableHead className="w-[60px] pr-5 text-center">View</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredShipments.map((shipment) => (
              <PlantRow
                key={shipment._id}
                shipment={shipment}
                setSelectedShipment={setSelectedShipment}
                setViewSheetOpen={setViewSheetOpen}
                setEditShipment={setEditShipment}
                shipmentData={shipmentData}
                setShipmentData={setShipmentData}
                onDeleted={onDeleted}
              />
            ))}

            {filteredShipments.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="w-8 h-8 text-muted-foreground/40" />
                    <p className="text-sm">No shipments found</p>
                    <p className="text-xs text-muted-foreground/70">Try adjusting your search or filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default ShipmentTable;