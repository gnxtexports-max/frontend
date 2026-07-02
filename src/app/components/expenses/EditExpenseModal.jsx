import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, Save, X, Upload, FileText, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { expenseTypes } from "./data/expensesData";

export function EditExpenseModal({ open, onOpenChange, expense, onSave }) {
  const [date, setDate] = useState();
  const [dateOpen, setDateOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open && expense) {
      setDate(expense.date ? new Date(expense.date) : new Date());
      setItems(expense.items && expense.items.length > 0 
        ? expense.items.map(item => ({ ...item, id: crypto.randomUUID() })) 
        : [{ id: crypto.randomUUID(), expenseType: expense.expenseType || "", amount: expense.amount || 0, liters: expense.liters || null, description: "" }]
      );
      setNotes(expense.notes || expense.description || "");
      setReceiptUrl(expense.receiptUrl || "");
    }
  }, [open, expense]);

  const addItem = () => {
    setItems(prev => [...prev, { id: crypto.randomUUID(), expenseType: "", amount: 0, liters: null, description: "" }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(`"${file.name}" exceeds the 5MB limit.`);
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setReceiptUrl(ev.target.result);
        }
        setUploading(false);
      };
      reader.onerror = () => {
        alert("Failed to read file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File processing error:", err);
      alert("Failed to process file");
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (items.some(item => !item.expenseType || item.amount <= 0)) {
      alert("Please enter a valid expense type and amount for all items.");
      return;
    }

    const payload = {
      items: items.map(({ id, ...rest }) => rest),
      date: date ? format(date, "yyyy-MM-dd") : null,
      notes,
      receiptUrl,
    };

    await onSave(expense._id, payload);
    onOpenChange(false);
  };

  if (!expense) return null;

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-base tracking-tight">Edit Expense</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update details for Trip {expense.tripId || expense.lrNumber}
          </DialogDescription>
        </DialogHeader>
        <Separator className="mt-4" />
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start h-10 text-sm bg-white border-border hover:bg-white gap-2 ${
                    !date ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  {date ? format(date, "dd MMM yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d ?? undefined);
                    setDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">Expense Items</Label>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] text-[#1d4ed8] hover:bg-[#f0f4ff] gap-1" onClick={addItem}>
                <Plus className="w-3 h-3" /> Add Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end bg-[#f8f9fb] p-2.5 rounded-lg border border-border/50 relative group">
                  <div className="col-span-5 space-y-1">
                    {idx === 0 && <Label className="text-[10px] text-muted-foreground">Type</Label>}
                    <Select value={item.expenseType} onValueChange={(v) => updateItem(item.id, "expenseType", v)}>
                      <SelectTrigger className="h-9 bg-white border-border text-xs">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseTypes.filter(Boolean).map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-5 space-y-1">
                    {idx === 0 && <Label className="text-[10px] text-muted-foreground">Amount</Label>}
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateItem(item.id, "amount", parseFloat(e.target.value) || 0)}
                        className="pl-6 h-9 bg-white border-border text-xs"
                        placeholder="Amount"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 pb-1 text-right">
                    {items.length > 1 && (
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem(item.id)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
            <span className="text-xs text-blue-700 font-semibold">Total Trip Expense</span>
            <span className="text-sm text-blue-700 font-bold tabular-nums">₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional details..."
                className="bg-white border-border resize-none h-[116px] text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Upload Receipt</Label>
              <div 
                className="border-2 border-dashed border-border rounded-lg p-5 text-center hover:border-[#1d4ed8]/30 hover:bg-[#f0f4ff]/30 transition-colors cursor-pointer relative h-[116px] flex flex-col justify-center"
                onClick={() => document.getElementById('edit-receipt-upload').click()}
              >
                <input 
                  id="edit-receipt-upload"
                  type="file" 
                  className="hidden" 
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileUpload}
                />
                {uploading ? (
                  <p className="text-xs text-muted-foreground">Uploading...</p>
                ) : receiptUrl ? (
                  <div className="flex flex-col items-center gap-1">
                    <FileText className="w-5 h-5 text-[#1d4ed8] mx-auto" />
                    <p className="text-xs text-[#1d4ed8] font-medium">Receipt Uploaded</p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                      {receiptUrl.split('/').pop()}
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">
                      Drag & drop or{" "}
                      <span className="text-[#1d4ed8] hover:underline">browse</span> to upload
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">PNG, JPG, PDF up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white gap-2 shadow-sm">
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EditExpenseModal;

