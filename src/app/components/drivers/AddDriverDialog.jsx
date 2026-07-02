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
import { Users, PhoneIcon, Loader2 } from "lucide-react";

const PHONE_REGEX = /^\+?[0-9\s-()]{10,}$/;
const LICENSE_REGEX = /^[A-Z]{2}-[0-9]{1,2}-[A-Z]{2}-[0-9]{4,7}$/;

export function AddDriverDialog({
  open,
  onOpenChange,
  onAddDriver,
  onUpdateDriver,
  editingDriver,
}) {
  const [formData, setFormData] = useState({
    driverType: "",
    name: "",
    age: "",
    phone: "",
    licenseNumber: "",
    tripStatus: "Idle",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingDriver) {
      setFormData({
        driverType: editingDriver.driverType,
        name: editingDriver.name,
        age: editingDriver.age,
        phone: editingDriver.phone,
        licenseNumber: editingDriver.licenseNumber,
        tripStatus: editingDriver.tripStatus,
      });
    } else {
      setFormData({
        driverType: "",
        name: "",
        age: "",
        phone: "",
        licenseNumber: "",
        tripStatus: "Idle",
      });
    }
    setErrors({});
  }, [editingDriver, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.driverType.trim()) {
      newErrors.driverType = "Driver type is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Driver name is required";
    }

    if (!formData.age || formData.age < 18 || formData.age > 65) {
      newErrors.age = "Age must be between 18 and 65";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!PHONE_REGEX.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = "License number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let success;
      if (editingDriver) {
        success = await onUpdateDriver(editingDriver._id, formData);
      } else {
        success = await onAddDriver(formData);
      }

      if (success) {
        onOpenChange(false);
        setFormData({
          driverType: "",
          name: "",
          age: "",
          phone: "",
          licenseNumber: "",
          tripStatus: "Idle",
        });
        setErrors({});
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1d4ed8]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#1d4ed8]" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {editingDriver ? "Edit Driver" : "Add New Driver"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {editingDriver
                  ? "Update the driver details below"
                  : "Enter the driver details below to register a new driver"}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Driver Type */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Driver Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.driverType}
              onValueChange={(value) =>
                setFormData({ ...formData, driverType: value })
              }
            >
              <SelectTrigger
                className={`w-full h-10 bg-[#f8f9fb] border-border ${
                  errors.driverType ? "border-red-500" : ""
                }`}
              >
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Own">Own</SelectItem>
                <SelectItem value="Hired">Hired</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
              </SelectContent>
            </Select>
            {errors.driverType && (
              <p className="text-xs text-red-500">{errors.driverType}</p>
            )}
          </div>

          {/* Name & Age */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Driver Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Ramesh Patil"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`h-10 bg-[#f8f9fb] border-border focus:bg-white transition-colors ${
                  errors.name ? "border-red-500" : ""
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Age <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. 35"
                type="number"
                min="18"
                max="65"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                className={`h-10 bg-[#f8f9fb] border-border focus:bg-white transition-colors ${
                  errors.age ? "border-red-500" : ""
                }`}
              />
              {errors.age && (
                <p className="text-xs text-red-500">{errors.age}</p>
              )}
            </div>
          </div>

          {/* Phone & License */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Mobile Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className={`h-10 bg-[#f8f9fb] border-border focus:bg-white transition-colors pl-9 ${
                    errors.phone ? "border-red-500" : ""
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                License Number <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. MH-14-AB-1234567"
                value={formData.licenseNumber}
                onChange={(e) =>
                  setFormData({ ...formData, licenseNumber: e.target.value })
                }
                className={`h-10 bg-[#f8f9fb] border-border focus:bg-white transition-colors ${
                  errors.licenseNumber ? "border-red-500" : ""
                }`}
              />
              {errors.licenseNumber && (
                <p className="text-xs text-red-500">{errors.licenseNumber}</p>
              )}
            </div>
          </div>

          {/* Trip Status */}
          {editingDriver && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Trip Status
              </Label>
              <Select
                value={formData.tripStatus}
                onValueChange={(value) =>
                  setFormData({ ...formData, tripStatus: value })
                }
              >
                <SelectTrigger className="w-full h-10 bg-[#f8f9fb] border-border">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Driving">Driving</SelectItem>
                  <SelectItem value="Idle">Idle</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                 
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-[#f8f9fb]/60 flex items-center justify-end gap-3">
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
            className="h-9 px-5 text-sm bg-[#1d4ed8] hover:bg-[#1e40af] text-white gap-2"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {editingDriver ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>{editingDriver ? "Update Driver" : "Add Driver"}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddDriverDialog;