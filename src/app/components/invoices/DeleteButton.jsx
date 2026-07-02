import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

export function DeleteButton({ invoiceId, onDeleted }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE_URL}/invoices/${invoiceId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Delete failed");
      }

      onDeleted(invoiceId);
      setOpen(false);
    } catch (err) {
      console.error("Delete invoice error:", err);
      alert(`Delete failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={loading}
        className="text-red-500 hover:text-red-700 transition-colors"
        title="Delete Invoice"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="bg-white border border-border shadow-lg rounded-xl max-w-md p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
              Delete Invoice?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500 mt-2">
              Are you sure you want to delete this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex justify-end gap-3">
            <AlertDialogCancel 
              className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm transition-colors"
              disabled={loading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default DeleteButton;