import { STATUS_STYLES } from "./utils/invoiceStyles";
import { AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export function StatusBadge({ status, isDelayed }) {
  const baseStyle =
    isDelayed && status === "Pending"
      ? "bg-red-50 text-red-700 border border-red-200" // special style for delayed
      : STATUS_STYLES[status] || "bg-gray-100 text-gray-700";

  const badge = (
    <div
      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${baseStyle}`}
    >
      {isDelayed && status === "Pending" && (
        <AlertCircle className="w-3 h-3 mr-1 text-red-600" />
      )}
      {status}
    </div>
  );

  if (isDelayed && status === "Pending") {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="cursor-help">{badge}</div>
          </TooltipTrigger>
          <TooltipContent className="bg-red-50 border border-red-100 text-red-800 shadow-sm px-3 py-2 max-w-[250px]">
            <p className="text-xs font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Unassigned for over 24 hours
            </p>
            <p className="text-[10px] text-red-700/80 mt-1">
              This invoice was uploaded more than 24 hours ago but hasn't been assigned to a vehicle yet.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

export default StatusBadge;