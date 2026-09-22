import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { UserCheck, Sparkles, Phone, Mail, Loader2, Lock } from "lucide-react";

const API_BASE_URL = (import.meta.env?.VITE_API_URL || "http://localhost:5000/api") + "/supervisors";

export function AddSupervisorDialog({
  open,
  onOpenChange,
  onAddSupervisor,
  onUpdateSupervisor,
  editingSupervisor,
}) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    status: "Active",
  });
  const [previewEmployeeId, setPreviewEmployeeId] = useState("EMP-0001");
  const [loadingNextId, setLoadingNextId] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch next employee ID preview when opening modal in Add mode
  useEffect(() => {
    if (open && !editingSupervisor) {
      setLoadingNextId(true);
      fetch(`${API_BASE_URL}/next-id`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (data?.nextEmployeeId) {
            setPreviewEmployeeId(data.nextEmployeeId);
          }
        })
        .catch((err) => console.error("Error fetching next supervisor ID:", err))
        .finally(() => setLoadingNextId(false));
    }
  }, [open, editingSupervisor]);

  useEffect(() => {
    if (editingSupervisor) {
      setFormData({
        name: editingSupervisor.name || "",
        phone: editingSupervisor.phone || "",
        email: editingSupervisor.email || "",
        status: editingSupervisor.status || "Active",
      });
      setPreviewEmployeeId(editingSupervisor.employeeId || "—");
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        status: "Active",
      });
    }
    setErrors({});
  }, [editingSupervisor, open]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) {
      newErrors.name = "Supervisor name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let success;
      if (editingSupervisor) {
        success = await onUpdateSupervisor(editingSupervisor._id, formData);
      } else {
        success = await onAddSupervisor(formData);
      }

      if (success) {
        onOpenChange(false);
        setFormData({
          name: "",
          phone: "",
          email: "",
          status: "Active",
        });
        setErrors({});
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-[#1d4ed8]" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {editingSupervisor ? "Edit Supervisor" : "Add New Supervisor"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {editingSupervisor
                  ? "Update supervisor profile details"
                  : "Register a supervisor with an automatically generated Employee ID"}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto bg-white">
          {/* Employee ID (Auto-Generated & Read-Only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-muted-foreground" />
                Employee ID
              </Label>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Auto-generated
              </span>
            </div>
            <div className="relative">
              <Input
                value={loadingNextId ? "Generating..." : previewEmployeeId}
                disabled
                className="h-10 bg-slate-50/80 border-slate-200 text-foreground font-semibold tracking-wider cursor-not-allowed select-none"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Unique ID generated automatically following company sequence.
            </p>
          </div>

          {/* Supervisor Name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Supervisor Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g. Anand Kumar"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: null });
              }}
              className={`h-10 bg-[#f8f9fb] border-border focus:bg-white transition-colors ${
                errors.name ? "border-red-500 ring-1 ring-red-500" : ""
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Mobile Number (Optional)
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="e.g. +91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-10 bg-[#f8f9fb] border-border focus:bg-white transition-colors pl-9"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Email Address (Optional)
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="e.g. supervisor@gnxt.co.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-10 bg-[#f8f9fb] border-border focus:bg-white transition-colors pl-9"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(val) => setFormData({ ...formData, status: val })}
            >
              <SelectTrigger className="w-full h-10 bg-[#f8f9fb] border-border">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-[#f8f9fb]/80 flex items-center justify-end gap-3">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="h-9 px-4 text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            className="h-9 px-5 text-sm bg-[#1d4ed8] hover:bg-[#1e40af] text-white gap-2 shadow-sm"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {editingSupervisor ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>{editingSupervisor ? "Update Supervisor" : "Add Supervisor"}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddSupervisorDialog;
