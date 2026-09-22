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

        <TableCell>
          <PodStatusBadge podStatus={first?.podStatus || plant.podStatus} />
        </TableCell>

        <TableCell onClick={(e) => e.stopPropagation()}>
          {first && (() => {
            const { editable, reason } = checkBeforeRemarksEditable(first, canEdit);
            return (
              <RemarkCell
                invoiceId={first._id}
                field="beforeDispatchRemarks"
                initialValue={first.beforeDispatchRemarks}
                isEditable={editable}
                restrictionReason={reason}
              />
            );
          })()}
        </TableCell>

        <TableCell onClick={(e) => e.stopPropagation()}>
          {first && (() => {
            const { editable, reason } = checkAfterRemarksEditable(first, canEdit);
            return (
              <RemarkCell
                invoiceId={first._id}
                field="afterDispatchRemarks"
                initialValue={first.afterDispatchRemarks}
                isEditable={editable}
                restrictionReason={reason}
              />
            );
          })()}
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

            <TableCell>
              <PodStatusBadge podStatus={inv.podStatus} />
            </TableCell>

            <TableCell onClick={(e) => e.stopPropagation()}>
              {(() => {
                const { editable, reason } = checkBeforeRemarksEditable(inv, canEdit);
                return (
                  <RemarkCell
                    invoiceId={inv._id}
                    field="beforeDispatchRemarks"
                    initialValue={inv.beforeDispatchRemarks}
                    isEditable={editable}
                    restrictionReason={reason}
                  />
                );
              })()}
            </TableCell>

            <TableCell onClick={(e) => e.stopPropagation()}>
              {(() => {
                const { editable, reason } = checkAfterRemarksEditable(inv, canEdit);
                return (
                  <RemarkCell
                    invoiceId={inv._id}
                    field="afterDispatchRemarks"
                    initialValue={inv.afterDispatchRemarks}
                    isEditable={editable}
                    restrictionReason={reason}
                  />
                );
              })()}
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

const checkBeforeRemarksEditable = (inv, canEditGlobal) => {
  if (!canEditGlobal) return { editable: false, reason: "You do not have permission to edit invoices." };
  const status = inv.status;
  if (status === "Cancelled" || status === "In Transit" || status === "Delivered") {
    return { editable: false, reason: "Before Dispatch Remarks can only be edited before dispatch (up to 24h after assignment)." };
  }
  if (status === "Assigned") {
    const assignedTime = inv.assignedAt ? new Date(inv.assignedAt).getTime() : (inv.updatedAt ? new Date(inv.updatedAt).getTime() : null);
    if (assignedTime && Date.now() - assignedTime > 24 * 60 * 60 * 1000) {
      return { editable: false, reason: "The 24-hour editing window after assignment has expired." };
    }
  }
  return { editable: true, reason: "" };
};

const checkAfterRemarksEditable = (inv, canEditGlobal) => {
  if (!canEditGlobal) return { editable: false, reason: "You do not have permission to edit invoices." };
  const status = inv.status;
  if (status === "Cancelled") {
    return { editable: false, reason: "After Dispatch Remarks cannot be edited for cancelled invoices." };
  }
  const inTransitTime = inv.inTransitAt ? new Date(inv.inTransitAt).getTime() : (
    (status === "In Transit" || status === "Delivered") && inv.updatedAt ? new Date(inv.updatedAt).getTime() : null
  );
  if (inTransitTime) {
    if (Date.now() - inTransitTime > 7 * 24 * 60 * 60 * 1000) {
      return { editable: false, reason: "The 7-day editing window after dispatch (In Transit) has expired." };
    }
  }
  return { editable: true, reason: "" };
};

function RemarkCell({ invoiceId, field, initialValue, isEditable, restrictionReason }) {
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
        const data = await response.json();
        alert(data?.message || "Failed to save remark");
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
        title={!isEditable && restrictionReason ? restrictionReason : undefined}
        className={`cursor-pointer max-w-[150px] text-xs px-2.5 py-1.5 rounded-lg border transition-all font-medium truncate select-none shadow-sm flex items-center justify-between gap-1.5 ${
          isEditable
            ? "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 bg-white"
            : "border-slate-200/80 bg-slate-50 text-slate-500 hover:bg-slate-100/60"
        }`}
      >
        <span className={value ? "truncate flex-1" : "text-slate-400 italic flex-1"}>
          {value || (isEditable ? "Add remark..." : "No remarks")}
        </span>
        {isEditable ? (
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
              {isEditable ? "Update the remark for this invoice." : (restrictionReason || "View the remark for this invoice.")}
            </DialogDescription>
          </DialogHeader>

          {!isEditable && restrictionReason && (
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5 mt-2 text-xs text-amber-800">
              {restrictionReason}
            </div>
          )}

          <div className="my-4">
            <Textarea
              placeholder={isEditable ? "Type your remark here..." : "No remarks entered."}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              disabled={!isEditable || isSaving}
              className={`min-h-[120px] text-sm resize-none rounded-xl ${
                isEditable
                  ? "bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white"
                  : "bg-slate-100/70 border-slate-200 text-slate-700 cursor-not-allowed"
              }`}
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
              {isEditable ? "Cancel" : "Close"}
            </Button>
            {isEditable && (
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

function PodStatusBadge({ podStatus }) {
  let style = "bg-slate-50 text-slate-600 border-slate-200";
  let raw = podStatus || "Not Generated";
  let label = raw.replace(/^POD\s+/i, "");

  if (label === "Received" || raw === "POD Received") {
    style = "bg-emerald-50 text-emerald-700 border-emerald-200";
    label = "Received";
  } else if (label === "Pending" || raw === "POD Pending") {
    style = "bg-amber-50 text-amber-700 border-amber-200";
    label = "Pending";
  } else {
    style = "bg-slate-50 text-slate-600 border-slate-200";
    label = "Not Generated";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export default PlantRow;
