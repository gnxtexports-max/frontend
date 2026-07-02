import { AlertTriangle, Plus, Truck } from "lucide-react";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "../ui/sheet";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function AddVehicleSheet({
  open,
  onOpenChange,
  newVehicle,
  onVehicleChange,
  onAddVehicle,
  isEditing = false,
}) {
  const isFormValid =
    newVehicle.vehicleNo &&
    newVehicle.ownership;

  const handleInputChange = (field, value) => {
    onVehicleChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] p-0 flex flex-col gap-0 [&>button]:top-4 [&>button]:right-4">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-[#1d4ed8]/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-[#1d4ed8]" />
            </div>
            <div>
              <SheetTitle className="text-base">
                {isEditing ? "Edit Vehicle" : "Add New Vehicle"}
              </SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                {isEditing
                  ? "Update the vehicle details below."
                  : "Fill in the details below to register a new vehicle."}
              </SheetDescription>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {/* Vehicle Number */}
            <div className="space-y-1.5">
              <Label
                htmlFor="vehicleNo"
                className="text-xs text-muted-foreground uppercase tracking-wider"
              >
                Vehicle Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="vehicleNo"
                placeholder="e.g. MH-12-AB-1234"
                value={newVehicle.vehicleNo}
                onChange={(e) =>
                  handleInputChange("vehicleNo", e.target.value)
                }
                disabled={isEditing}
                className="h-10 bg-[#f8f9fb] border-border focus:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Type & Model - side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="type"
                  className="text-xs text-muted-foreground uppercase tracking-wider"
                >
                  Vehicle Type <span className="text-muted-foreground normal-case tracking-normal">(optional)</span>
                </Label>
                <Input
                  id="type"
                  placeholder="e.g. Truck"
                  value={newVehicle.type || ""}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  className="h-10 bg-[#f8f9fb] border-border focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="model"
                  className="text-xs text-muted-foreground uppercase tracking-wider"
                >
                  Model <span className="text-muted-foreground normal-case tracking-normal">(optional)</span>
                </Label>
                <Input
                  id="model"
                  placeholder="e.g. Tata 407"
                  value={newVehicle.model || ""}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  className="h-10 bg-[#f8f9fb] border-border focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Capacity & Insurance - side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="capacityKg"
                  className="text-xs text-muted-foreground uppercase tracking-wider"
                >
                  Max Capacity <span className="text-muted-foreground normal-case tracking-normal">(optional)</span>
                </Label>
                <div className="relative">
                  <Input
                    id="capacityKg"
                    placeholder="e.g. 12000"
                    value={newVehicle.capacityKg || ""}
                    onChange={(e) =>
                      handleInputChange("capacityKg", e.target.value)
                    }
                    className="h-10 bg-[#f8f9fb] border-border focus:bg-white transition-colors pr-10"
                    type="number"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    kg
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="insuranceExpiry"
                  className="text-xs text-muted-foreground uppercase tracking-wider"
                >
                  Insurance Expiry <span className="text-muted-foreground normal-case tracking-normal">(optional)</span>
                </Label>
                <Input
                  id="insuranceExpiry"
                  value={newVehicle.insuranceExpiry || ""}
                  onChange={(e) =>
                    handleInputChange("insuranceExpiry", e.target.value)
                  }
                  className="h-10 bg-[#f8f9fb] border-border focus:bg-white transition-colors"
                  type="date"
                />
              </div>
            </div>

            {/* Ownership */}
            <div className="space-y-1.5">
              <Label
                htmlFor="ownership"
                className="text-xs text-muted-foreground uppercase tracking-wider"
              >
                Ownership <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newVehicle.ownership}
                onValueChange={(value) => handleInputChange("ownership", value)}
              >
                <SelectTrigger className="w-full h-10 bg-[#f8f9fb] border-border">
                  <SelectValue placeholder="Select ownership" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Company">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Company
                    </span>
                  </SelectItem>
                  <SelectItem value="Leased">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      Leased
                    </span>
                  </SelectItem>
                  <SelectItem value="Rented">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Rented
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info hint - only show when adding new vehicle */}
            {!isEditing && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700">
                  New vehicles will be added with{" "}
                  <span className="font-medium">Idle</span> status and{" "}
                  <span className="font-medium">Available</span> availability.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-[#f8f9fb]/60 flex items-center justify-end gap-3">
          <SheetClose asChild>
            <Button
              type="button"
              variant="outline"
              className="h-9 px-4 text-sm"
            >
              Cancel
            </Button>
          </SheetClose>
          <Button
            type="button"
            className="h-9 px-5 text-sm bg-[#1d4ed8] hover:bg-[#1e40af] text-white gap-2"
            disabled={!isFormValid}
            onClick={onAddVehicle}
          >
            <Plus className="w-4 h-4" />
            {isEditing ? "Update Vehicle" : "Add Vehicle"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
