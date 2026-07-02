export const createdByOptions = ["Admin", "Manager", "Operator"];

export function getDeliveryProgress(shipment) {
  if (!shipment || !shipment.destinations || shipment.destinations.length === 0) return null;
  const total = shipment.destinations.length;
  const delivered = shipment.destinations.filter(d => d.status === "Delivered").length;
  if (delivered === 0) return null;
  return { delivered, total };
}

export function getDisplayStatus(shipment) {
  if (!shipment) return "N/A";
  if (shipment.status === "Closed") return "Closed";
  if (shipment.status === "Cancelled") return "Cancelled";
  if (shipment.status === "Pending") return "Pending";
  if (shipment.status === "In Transit") return "In Transit";
  if (shipment.status === "Delivered") {
    const progress = getDeliveryProgress(shipment);
    if (progress && progress.delivered < progress.total) {
      return `Delivered ${progress.delivered}/${progress.total}`;
    }
    return "Delivered";
  }
  return shipment.status || "N/A";
}

export const statusConfig = {
  Pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  "In Transit": {
    label: "In Transit",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  Delivered: {
    label: "Delivered",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  Cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  Closed: {
    label: "Closed",
    className: "bg-slate-100 text-slate-800 border-slate-300",
  },
  "Delivered Partial": {
    label: "Delivered",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

export function getPODConfig(shipment) {
  if (!shipment) {
    return {
      label: "N/A",
      icon: false,
      className: "bg-gray-50 text-gray-400 border-gray-200",
    };
  }

  // If shipment is pending dispatch, POD is not generated yet
  if (shipment.status === "Pending") {
    return {
      label: "Not Generated",
      icon: false,
      className: "bg-gray-50 text-gray-500 border-gray-200",
    };
  }

  const destinations = shipment.destinations || [];
  const total = destinations.length;

  if (total === 0) {
    return {
      label: "Not Generated",
      icon: false,
      className: "bg-gray-50 text-gray-500 border-gray-200",
    };
  }

  // Count how many destinations have uploaded/submitted POD (images are required for proof!)
  let signedCount = destinations.filter((d) =>
    d.podImages && d.podImages.length > 0
  ).length;

  // Fallback for older single-destination shipments where podImages was stored at the top level
  if (signedCount === 0 && shipment.podImages && shipment.podImages.length > 0) {
    signedCount = total;
  }

  // 2. Once all are uploaded/submitted -> "Signed"
  if (signedCount === total) {
    return {
      label: "Signed",
      icon: true,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  // 3. If multiple destinations and POD is submitted for few destinations -> "Partial (1/2)" or "Partial (2/3)"
  if (total > 1 && signedCount > 0) {
    return {
      label: `Partial (${signedCount}/${total})`,
      icon: false,
      className: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  // 4. Initial after dispatch / no uploads yet -> "Pending"
  return {
    label: "Pending",
    icon: false,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  };
}

export function isWithinDateRange(date, filter) {
  if (!date) return false;
  const shipmentDate = new Date(date);
  const now = new Date();

  switch (filter) {
    case "today":
      return shipmentDate.toDateString() === now.toDateString();
    case "week": {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return shipmentDate >= weekAgo;
    }
    case "month":
      return (
        shipmentDate.getMonth() === now.getMonth() &&
        shipmentDate.getFullYear() === now.getFullYear()
      );
    default:
      return true;
  }
}