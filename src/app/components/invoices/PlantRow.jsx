import { useState, useEffect } from "react";
import {
  TableRow,
  TableCell,
} from "../ui/table";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Eye,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
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
            {first?.flap ?? 0}
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
          <StatusBadge status={first?.status || plant.status} isDelayed={isPendingDelayed} cancellationReason={first?.cancellationReason} />
        </TableCell>

        <TableCell onClick={(e) => e.stopPropagation()}>
          {first && (
            <RemarkCell
              invoiceId={first._id}
              field="beforeDispatchRemarks"
              initialValue={first.beforeDispatchRemarks}
              canEdit={canEdit}
            />
          )}
        </TableCell>

        <TableCell onClick={(e) => e.stopPropagation()}>
          {first && (
            <RemarkCell
              invoiceId={first._id}
              field="afterDispatchRemarks"
              initialValue={first.afterDispatchRemarks}
              canEdit={canEdit}
            />
          )}
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
                {inv.flap ?? 0}
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
              <StatusBadge status={inv.status} cancellationReason={inv.cancellationReason} />
            </TableCell>

            <TableCell onClick={(e) => e.stopPropagation()}>
              <RemarkCell
                invoiceId={inv._id}
                field="beforeDispatchRemarks"
                initialValue={inv.beforeDispatchRemarks}
                canEdit={canEdit}
              />
            </TableCell>

            <TableCell onClick={(e) => e.stopPropagation()}>
              <RemarkCell
                invoiceId={inv._id}
                field="afterDispatchRemarks"
                initialValue={inv.afterDispatchRemarks}
                canEdit={canEdit}
              />
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

function RemarkCell({ invoiceId, field, initialValue, canEdit }) {
  const [value, setValue] = useState(initialValue || "");
  const [tempValue, setTempValue] = useState(initialValue || "");
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValue(initialValue || "");
    setTempValue(initialValue || "");
  }, [initialValue]);

  const handleOpen = () => {
    setTempValue(value);
    setIsOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/remarks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [field]: tempValue }),
      });
      if (response.ok) {
        setValue(tempValue);
        setIsOpen(false);
      } else {
        console.error("Failed to save remark: response not ok");
      }
    } catch (err) {
      console.error("Failed to save remark", err);
    } finally {
      setIsSaving(false);
    }
  };

  const displayTitle = field === "beforeDispatchRemarks" ? "Before Dispatch Remarks" : "After Dispatch Remarks";

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {/* Clickable summary block */}
      <div
        onClick={handleOpen}
        className="cursor-pointer max-w-[150px] text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all font-medium truncate select-none text-slate-700 bg-white shadow-sm flex items-center justify-between gap-1.5"
      >
        <span className={value ? "truncate flex-1" : "text-slate-400 italic flex-1"}>
          {value || "Add remark..."}
        </span>
        {canEdit ? (
          <Edit2 className="w-2.5 h-2.5 text-slate-400 shrink-0" />
        ) : (
          <Eye className="w-2.5 h-2.5 text-slate-400 shrink-0" />
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-border shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">{displayTitle}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {canEdit ? "Update the remark for this invoice." : "View the remark for this invoice."}
            </DialogDescription>
          </DialogHeader>

          <div className="my-4">
            <Textarea
              placeholder={canEdit ? "Type your remark here..." : "No remarks entered."}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              disabled={!canEdit || isSaving}
              className="min-h-[120px] text-sm resize-none bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 border-slate-200 rounded-lg px-4"
              disabled={isSaving}
            >
              {canEdit ? "Cancel" : "Close"}
            </Button>
            {canEdit && (
              <Button
                size="sm"
                onClick={handleSave}
                className="text-xs font-semibold bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg px-4 flex items-center gap-1"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PlantRow;
