import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import PlantRow from "./PlantRow";

export function InvoiceTable({
  invoices,
  loading,
  currentPage,
  totalPages,
  total,
  onPageChange,
  onDeleted,
  onStatusUpdated,
  canEdit,
  canDelete,
}) {
  return (
    <div className="flex-1 min-h-0 bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-auto flex-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50">
            <Loader2 className="w-6 h-6 animate-spin text-[#1d4ed8]" />
          </div>
        )}

        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8 pl-4" />
              <TableHead>Plant No.</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {invoices.length === 0 && !loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-[300px] text-center"
                >
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((plant) => (
                <PlantRow
                  key={plant._id}
                  plant={plant}
                  onDeleted={onDeleted}
                  onStatusUpdated={onStatusUpdated}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
        <p className="text-xs text-muted-foreground">
          Page{" "}
          <span className="font-medium text-foreground">
            {currentPage}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {totalPages}
          </span>{" "}
          —{" "}
          <span className="font-medium text-foreground">
            {total}
          </span>{" "}
          plants
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange((p) => p - 1)}
          >
            Prev
          </Button>

          {Array.from(
            {
              length: Math.min(5, totalPages),
            },
            (_, i) => {
              const page =
                Math.max(
                  1,
                  Math.min(currentPage - 2, totalPages - 4)
                ) + i;

              return (
                <Button
                  key={page}
                  size="sm"
                  variant={
                    currentPage === page ? "default" : "outline"
                  }
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              );
            }
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={
              currentPage === totalPages || totalPages === 0
            }
            onClick={() => onPageChange((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InvoiceTable;