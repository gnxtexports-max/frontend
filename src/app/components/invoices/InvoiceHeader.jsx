import { FileText, Upload, Loader2, Plus } from "lucide-react";
import { Button as ButtonUI } from "../ui/button";



export function InvoiceHeader({
  total,
  uploading,
  onFileUpload,
  onHistoryClick,
  onAddClick,
  canCreate,
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          Invoices
        </h1>

        <p className="text-sm text-muted-foreground mt-1">
          {total > 0
            ? `${total} plant records`
            : "Manage and track customer invoices"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {canCreate && (
          <ButtonUI
            onClick={onAddClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Invoice
          </ButtonUI>
        )}

        {canCreate && (
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={onFileUpload}
              disabled={uploading}
            />

            <div className="inline-flex items-center gap-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Sheet
                </>
              )}
            </div>
          </label>
        )}

        <ButtonUI onClick={onHistoryClick} variant="outline" className="border-border">
          History
        </ButtonUI>
      </div>
    </div>
  );
}

export default InvoiceHeader;