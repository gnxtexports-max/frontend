export const vehicleTrackingData = {};

export const fallbackData = {
  vehicleNumber: "Unknown",
  driverName: "Unknown",
  driverPhone: "---",
  status: "Idle",
  shipmentId: "---",
  dealerName: "---",
  dealerLocation: "---",
  warehouseLocation: "Mumbai Warehouse",
  departedTime: "---",
  estimatedDelivery: "---",
  totalDistance: 0,
  distanceCovered: 0,
  remainingDistance: 0,
  eta: "---",
  percentComplete: 0,
  currentLocation: { area: "Unknown", lat: "---", lng: "---", lastUpdated: "---" },
  averageSpeed: "---",
  currentSpeed: "---",
  delay: null,
  timeline: [],
};

export const statusStyles = {
  Moving: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  Idle:   { bg: "bg-amber-50 border-amber-200",     text: "text-amber-700",   dot: "bg-amber-500"   },
  Stopped:{ bg: "bg-red-50 border-red-200",         text: "text-red-700",     dot: "bg-red-500"     },
  "Waiting for Dispatch": { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  "In Transit": { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  Delivered: { bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", dot: "bg-indigo-500" },
  "Awaiting Arrival": { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500 animate-pulse" },
  Arrived: { bg: "bg-green-50 border-green-200", text: "text-green-700", dot: "bg-green-500" },
  Closed: { bg: "bg-slate-50 border-slate-200", text: "text-slate-700", dot: "bg-slate-500" }
};

