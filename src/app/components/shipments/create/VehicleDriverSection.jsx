import { useEffect, useState } from "react";
import { Truck, User, Search, Info, Phone, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../ui/command";
import { ValidationWarning } from "../ui/ShipmentUIComponents";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

export function VehicleDriverSection({
  vehicleId, setVehicleId,
  vehicleOpen, setVehicleOpen,
  driverId, setDriverId,
  vehicles: propVehicles,
  loadingV: propLoadingV,
}) {
  const [internalVehicles, setInternalVehicles] = useState([]);
  const [drivers, setDrivers]   = useState([]);
  const [internalLoadingV, setInternalLoadingV] = useState(false);
  const [loadingD, setLoadingD] = useState(false);

  const vehicles = propVehicles !== undefined ? propVehicles : internalVehicles;
  const loadingV = propLoadingV !== undefined ? propLoadingV : internalLoadingV;

  // Fetch own vehicles if not passed as prop
  useEffect(() => {
    if (propVehicles !== undefined) return;
    setInternalLoadingV(true);
    fetch(`${API_BASE_URL}/vehicles`, { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setInternalVehicles(list);
      })
      .catch(() => setInternalVehicles([]))
      .finally(() => setInternalLoadingV(false));
  }, [propVehicles]);

  // Fetch drivers
  useEffect(() => {
    setLoadingD(true);
    fetch(`${API_BASE_URL}/drivers`, { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setDrivers(list);
      })
      .catch(() => setDrivers([]))
      .finally(() => setLoadingD(false));
  }, []);

  const selectedVehicle = vehicles.find((v) => v._id === vehicleId);
  const selectedDriver  = drivers.find((d) => d._id === driverId);

  // Only show available vehicles
  const availableVehicles = vehicles.filter((v) =>
    v.availability === "Available" || v.availability === undefined
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Vehicle Column ── */}
        <div className="space-y-4">
          <h4 className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-3.5 h-3.5" /> Vehicle Details
          </h4>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Vehicle Number</Label>
            <Popover open={vehicleOpen} onOpenChange={setVehicleOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={loadingV}
                  className="w-full justify-between bg-white border-border h-10 px-3 hover:bg-white"
                >
                  <span className={`flex items-center gap-2 truncate ${!selectedVehicle ? "text-muted-foreground" : "text-foreground"}`}>
                    {selectedVehicle ? (
                      <>
                        <Truck className="w-3.5 h-3.5 text-[#1d4ed8] shrink-0" />
                        {selectedVehicle.vehicleNo}
                        <span className="text-muted-foreground text-xs">({selectedVehicle.capacityKg} kg)</span>
                      </>
                    ) : (
                      <><Search className="w-3.5 h-3.5 shrink-0" />{loadingV ? "Loading..." : "Search vehicle number..."}</>
                    )}
                  </span>
                  <ChevronsUpDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Type vehicle number..." />
                  <CommandList>
                    <CommandEmpty>
                      <div className="flex flex-col items-center gap-1 py-3">
                        <Truck className="w-4 h-4 text-muted-foreground/40" />
                        <span className="text-sm text-muted-foreground">No vehicle found</span>
                      </div>
                    </CommandEmpty>
                    <CommandGroup heading="Own Vehicles">
                      {availableVehicles.map((v) => (
                        <CommandItem
                          key={v._id}
                          value={v.vehicleNo}
                          onSelect={() => { setVehicleId(v._id === vehicleId ? "" : v._id); setVehicleOpen(false); }}
                          className="flex items-center justify-between gap-2 py-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                              <Truck className="w-3 h-3 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-foreground truncate">{v.vehicleNo}</p>
                              <p className="text-[11px] text-muted-foreground">Capacity: {v.capacityKg} kg</p>
                            </div>
                          </div>
                          <Check className={`w-4 h-4 shrink-0 ${vehicleId === v._id ? "text-[#1d4ed8] opacity-100" : "opacity-0"}`} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Selected vehicle details */}
          {selectedVehicle && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50/60 border border-blue-100 rounded-lg">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-xs text-blue-700">
                Capacity: <span className="text-blue-900 font-medium">{selectedVehicle.capacityKg} kg</span>
                {selectedVehicle.type && (
                  <span className="ml-2 text-blue-600">· {selectedVehicle.type}</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* ── Driver Column ── */}
        <div className="space-y-4">
          <h4 className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Driver Details
          </h4>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Driver Name</Label>
            <Select value={driverId} onValueChange={setDriverId} disabled={loadingD}>
              <SelectTrigger className="bg-white border-border h-10">
                <SelectValue placeholder={loadingD ? "Loading..." : "Select driver..."} />
              </SelectTrigger>
              <SelectContent>
                {drivers.filter((d) => d && d._id).map((d) => (
                  <SelectItem
                    key={d._id}
                    value={d._id}
                    disabled={d.tripStatus === "Driving" || d.tripStatus === "Assigned"}
                  >
                    <span className="flex items-center gap-3">
                      {d.name}
                      {(d.tripStatus === "Driving" || d.tripStatus === "Assigned") && (
                        <span className="text-[10px] text-red-500">(On Trip)</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDriver && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50/60 border border-emerald-100 rounded-lg">
              <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-xs text-emerald-700">{selectedDriver.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Validation warnings */}
      {selectedDriver && (selectedDriver.tripStatus === "Driving" || selectedDriver.tripStatus === "Assigned") && (
        <ValidationWarning message="This driver is currently on an active trip." />
      )}
    </div>
  );
}

export default VehicleDriverSection;
