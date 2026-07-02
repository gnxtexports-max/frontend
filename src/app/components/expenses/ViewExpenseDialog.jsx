import { format } from "date-fns";
import { FileText, Banknote, Smartphone, CreditCard, ExternalLink, StickyNote } from "lucide-react";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Separator } from "../ui/separator";

function ExpenseTypeBadge({ type }) {
  const styles = {
    Fuel: "bg-orange-50 text-orange-700 border-orange-200",
    Toll: "bg-violet-50 text-violet-700 border-violet-200",
    Maintenance: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Loading/Unloading": "bg-blue-50 text-blue-700 border-blue-200",
    "Driver Allowance": "bg-amber-50 text-amber-700 border-amber-200",
    Miscellaneous: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${styles[type]}`}>
      {type}
    </Badge>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export function ViewExpenseDialog({ expense, onClose }) {
  if (!expense) return null;

  return (
    <Dialog open={!!expense} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[440px] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-base tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1d4ed8]" />
            Expense Details
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {expense.id}
          </DialogDescription>
        </DialogHeader>
        <Separator className="mt-4" />
        <div className="px-6 py-5 space-y-4">
          <DetailRow label="LR Number" value={expense.lrNumber} />
          <DetailRow
            label="Date"
            value={(() => {
              try {
                if (!expense.date) return "N/A";
                const d = new Date(expense.date);
                // If the date string is just YYYY-MM-DD, parsing might need T00:00:00 for local time
                const safeDate = isNaN(d.getTime()) ? new Date(expense.date + "T00:00:00") : d;
                return isNaN(safeDate.getTime()) ? "Invalid Date" : format(safeDate, "dd MMM yyyy");
              } catch (e) {
                return "Invalid Date";
              }
            })()}
          />

          <DetailRow label="Driver" value={expense.driverName} />
          <DetailRow label="Vehicle" value={expense.vehicleId} />
          
          <Separator />
          
          <div className="space-y-3">
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Expense Breakdown</h4>
            {expense.items && expense.items.length > 0 ? (
              <div className="space-y-2">
                {expense.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#f8f9fb] border border-border/50">
                    <div className="space-y-0.5">
                      <ExpenseTypeBadge type={item.expenseType} />
                      {item.description && <p className="text-[10px] text-muted-foreground">{item.description}</p>}
                      {item.liters && <p className="text-[10px] text-orange-600 font-medium">{item.liters} Ltrs Fuel</p>}
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#f8f9fb] border border-border/50">
                <ExpenseTypeBadge type={expense.expenseType} />
                <span className="text-sm font-medium tabular-nums">
                  ₹{expense.amount?.toLocaleString("en-IN")}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between px-2 pt-2">
              <span className="text-xs font-semibold text-foreground">Total Amount</span>
              <span className="text-sm font-bold text-[#1d4ed8] tabular-nums">
                ₹{expense.amount?.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {expense.description && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <StickyNote className="w-3.5 h-3.5" />
                Notes
              </div>
              <p className="text-sm text-foreground bg-[#f8f9fb] p-3 rounded-lg border border-border italic">
                "{expense.description}"
              </p>
            </div>
          )}

          {expense.receiptUrl && (
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full justify-between h-10 text-xs border-dashed border-border hover:text-[#1d4ed8] hover:border-[#1d4ed8]/30 group"
                onClick={() => {
                  const url = expense.receiptUrl;
                  if (url.startsWith("data:")) {
                    const newWindow = window.open();
                    if (newWindow) {
                      newWindow.document.write(`<img src="${url}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                      newWindow.document.title = "Receipt Preview";
                    }
                  } else {
                    const base = (import.meta.env?.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
                    window.open(`${base}${url}`, "_blank");
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#1d4ed8]" />
                  View Receipt
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </Button>
            </div>
          )}
        </div>

        <Separator />
        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <Button variant="outline" onClick={onClose} className="border-border">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default ViewExpenseDialog;
