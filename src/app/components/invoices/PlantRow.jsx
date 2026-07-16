import { useState } from "react";
import {
  TableRow,
  TableCell,
} from "../ui/table";
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "../ui/button";
import StatusBadge from "./StatusBadge";
import DeleteButton from "./DeleteButton";
import CancelButton from "./CancelButton";

export function PlantRow({ plant, onDeleted, onStatusUpdated, onEditClick, canEdit, canDelete }) {
  const [expanded, setExpanded] = useState(false);

  const invoices = plant.invoices ?? [];

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const first = invoices[0];
  const rest = invoices.slice(1);

  const isPendingDelayed =
    first?.status === "Pending" &&
    plant.createdAt &&
    Date.now() - new Date(plant.createdAt).getTime() > 24 * 60 * 60 * 1000;

  return (
    <>
      <TableRow
        className="hover:bg-muted/40 cursor-pointer"
        onClick={() => rest.length > 0 && setExpanded((p) => !p)}
      >
        <TableCell className="pl-4 w-8">
          {rest.length > 0 ? (
            expanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )
          ) : null}
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">
              {plant.plantNumber}
            </span>

            {invoices.length > 1 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                +{invoices.length - 1}
              </span>
            )}
          </div>
        </TableCell>

        <TableCell>
          <span className="text-sm text-foreground">
            {plant.customerName}
          </span>
        </TableCell>

        <TableCell>
          <span className="text-sm text-muted-foreground">
            {plant.location || "—"}
          </span>
        </TableCell>

        <TableCell>
          <span className="text-sm text-[#1d4ed8] font-medium">
            {first?.invoiceNumber || "—"}
          </span>
        </TableCell>

        <TableCell>
          <span className="text-sm text-muted-foreground">
            {first?.invoiceDate
              ? formatDate(first.invoiceDate)
              : "—"}
          </span>
        </TableCell>

        <TableCell>
          <span className="text-sm font-medium text-slate-700">
            {first?.tyre ?? 0}
          </span>
        </TableCell>

        <TableCell>
          <span className="text-sm font-medium text-slate-700">
            {first?.tube ?? 0}
          </span>
        </TableCell>

        <TableCell>
          <span className="text-sm font-medium text-slate-700">
            {first?.glap ?? 0}
          </span>
        </TableCell>

        <TableCell>
          <span className="text-sm font-medium text-slate-700">
            {first?.quantity ?? 0}
          </span>
        </TableCell>

        <TableCell>
          <span className="text-sm font-medium text-slate-700">
            {first?.weight ?? 0} <span className="text-[10px] text-muted-foreground">kg</span>
          </span>
        </TableCell>

        <TableCell>
          <StatusBadge status={first?.status || plant.status} isDelayed={isPendingDelayed} />
        </TableCell>

        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            {canEdit && first && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-[#1d4ed8] hover:bg-blue-50 font-medium text-xs border border-transparent hover:border-blue-200 rounded"
                onClick={() => onEditClick({ ...first, plantNumber: plant.plantNumber, customerName: plant.customerName, location: plant.location })}
              >
                Edit
              </Button>
            )}
            {canEdit && first && first.status !== "Cancelled" && (
              <CancelButton
                invoiceId={first._id}
                invoiceNumber={first.invoiceNumber}
                currentStatus={first.status}
                onStatusUpdated={onStatusUpdated}
              />
            )}
            {canDelete && first && (
              <DeleteButton
                invoiceId={first._id}
                onDeleted={onDeleted}
              />
            )}
          </div>
        </TableCell>
      </TableRow>

      {expanded &&
        rest.map((inv) => (
          <TableRow
            key={inv._id}
            className="bg-blue-50/30 hover:bg-blue-50/50"
          >
            <TableCell className="pl-4" />
            <TableCell />
            <TableCell />
            <TableCell />

            <TableCell>
              <span className="text-sm text-[#1d4ed8] font-medium pl-2">
                {inv.invoiceNumber}
              </span>
            </TableCell>

            <TableCell>
              <span className="text-sm text-muted-foreground">
                {formatDate(inv.invoiceDate)}
              </span>
            </TableCell>

            <TableCell>
              <span className="text-sm text-slate-600">
                {inv.tyre ?? 0}
              </span>
            </TableCell>

            <TableCell>
              <span className="text-sm text-slate-600">
                {inv.tube ?? 0}
              </span>
            </TableCell>

            <TableCell>
              <span className="text-sm text-slate-600">
                {inv.glap ?? 0}
              </span>
            </TableCell>

            <TableCell>
              <span className="text-sm text-slate-600">
                {inv.quantity ?? 0}
              </span>
            </TableCell>

            <TableCell>
              <span className="text-sm text-slate-600">
                {inv.weight ?? 0} <span className="text-[10px] text-muted-foreground">kg</span>
              </span>
            </TableCell>

            <TableCell>
              <StatusBadge status={inv.status} />
            </TableCell>

            <TableCell onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-[#1d4ed8] hover:bg-blue-50 font-medium text-xs border border-transparent hover:border-blue-200 rounded"
                    onClick={() => onEditClick({ ...inv, plantNumber: plant.plantNumber, customerName: plant.customerName, location: plant.location })}
                  >
                    Edit
                  </Button>
                )}
                {canEdit && inv.status !== "Cancelled" && (
                  <CancelButton
                    invoiceId={inv._id}
                    invoiceNumber={inv.invoiceNumber}
                    currentStatus={inv.status}
                    onStatusUpdated={onStatusUpdated}
                  />
                )}
                {canDelete && (
                  <DeleteButton
                    invoiceId={inv._id}
                    onDeleted={onDeleted}
                  />
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}

export default PlantRow;
