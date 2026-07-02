import React, { useState, useRef } from "react";
import { FileCheck, Clock, Camera, FileText, Image, Eye, Download, Upload, X, CheckCircle2, CircleDot, Circle, Disc, MapPin, Hash, Weight, ChevronRight } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { SectionLabel, DetailField } from "../ui/ShipmentUIComponents";

export function PODSection({
  shipment,
  detail,
  onSaveDestinationPOD,
  onDestinationDeliverySuccess,
  setPodViewImage,
  canEdit = true,
}) {
  const destinations = shipment?.destinations ?? [];

  return (
    <div className="space-y-6">
      <SectionLabel icon={<FileCheck className="w-4 h-4" />} title="Proof of Dispatch & Destination Delivery" />
      <div className="space-y-4">
        {destinations.map((dest, index) => (
          <DestinationPODCard
            key={dest._id || index}
            dest={dest}
            index={index}
            totalCount={destinations.length}
            timeline={detail?.timeline}
            onSavePOD={onSaveDestinationPOD}
            onDeliverySuccess={onDestinationDeliverySuccess}
            setPodViewImage={setPodViewImage}
            shipmentStatus={shipment.status}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  );
}

function DestinationPODCard({
  dest,
  index,
  totalCount,
  timeline,
  onSavePOD,
  onDeliverySuccess,
  setPodViewImage,
  shipmentStatus = "Pending",
  canEdit = true,
}) {
  const [receiverName, setReceiverName] = useState(dest.podReceiverName || "");
  const [remarks, setRemarks] = useState(dest.podRemarks || "");
  const [images, setImages] = useState(dest.podImages || []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isDestDelivered = dest.status === "Delivered";
  const isPodSaved = !!(dest.podImages?.length > 0 || dest.podReceiverName || dest.podRemarks);

  const isPending = shipmentStatus === "Pending";
  const isClosed = shipmentStatus === "Cancelled";

  const lrDisplay = dest.lrNumber || `LR-TEMP-${index + 1}`;

  const handleSave = async () => {
    setUploading(true);
    try {
      await onSavePOD(dest._id, {
        podReceiverName: receiverName,
        podRemarks: remarks,
        podImages: images,
      });
      alert("POD saved successfully for " + dest.customerName);
    } catch (err) {
      console.error(err);
      alert("Failed to save POD: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Destination Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-[#fafbfc]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-[#1d4ed8]/10 text-[#1d4ed8] text-xs font-bold flex items-center justify-center">
            {index + 1}
          </div>
          <div>
            <span className="text-xs font-semibold text-[#1d4ed8]">Destination {index + 1} of {totalCount}</span>
            <span className="ml-2.5 text-xs text-muted-foreground font-semibold">LR: {lrDisplay}</span>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
            isDestDelivered && images.length > 0
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {isDestDelivered ? (
            images.length > 0 ? (
              <><CheckCircle2 className="w-3 h-3" /> Signed & Delivered</>
            ) : (
              <><Clock className="w-3 h-3" /> Delivered (Pending POD)</>
            )
          ) : (
            <><Clock className="w-3 h-3" /> Awaiting Delivery</>
          )}
        </span>
      </div>

      {/* Destination Info & Items Breakdown Combined */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Left Side: Destination Details */}
        <div className="space-y-4 pr-0 md:pr-6">
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer Info</h4>
            <p className="text-base text-foreground font-bold mt-1.5">{dest.customerName || "—"}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{dest.deliveryLocation || "—"}</span>
              <span className="text-slate-300">|</span>
              <span>Ref: {dest.plantReferenceNumber || "—"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-[#fafbfc] border border-border p-3.5 rounded-xl">
            <DetailField label="Weight" value={`${dest.weightKg} kg`} />
            <DetailField label="Quantity" value={`${dest.totalQuantity || (dest.totalTyres || 0) + (dest.totalTubes || 0) + (dest.totalFlaps || 0)} items`} />
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cargo Items</h4>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <CircleDot className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs text-muted-foreground">Tyres:</span>
                <span className="text-xs font-semibold text-foreground">{dest.totalTyres || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs text-muted-foreground">Flaps:</span>
                <span className="text-xs font-semibold text-foreground">{dest.totalFlaps || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Circle className="w-3.5 h-3.5 text-violet-600" />
                <span className="text-xs text-muted-foreground">Tubes:</span>
                <span className="text-xs font-semibold text-foreground">{dest.totalTubes || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Items & POD status */}
        <div className="space-y-4 pl-0 md:pl-6 pt-4 md:pt-0">

          {/* Conditional rendering based on shipmentStatus */}
          {isClosed ? (
            /* 1. Shipment is Cancelled or Closed (Locked Read-Only View) */
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailField label="Receiver Name" value={dest.podReceiverName || "—"} />
                <DetailField label="Delivery Remarks" value={dest.podRemarks || "—"} />
              </div>
              {dest.podImages?.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Proof Images</p>
                  <div className="flex flex-wrap gap-2">
                    {dest.podImages.map((img, idx) => (
                      <div key={idx} className="relative w-12 h-12 rounded border border-border overflow-hidden bg-white cursor-pointer hover:border-[#1d4ed8] transition-colors" onClick={() => setPodViewImage(img)}>
                        <img src={img} alt="POD" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 2. Active Editable Form (always accessible) */
            <div className="space-y-4">
              {isDestDelivered && (
                <div className="flex items-center gap-2 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-3.5 py-2.5 text-xs text-[#15803d] font-semibold leading-normal">
                  <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />
                  <span>Delivery confirmed. You can still upload proof images and save POD details below until the shipment is closed.</span>
                </div>
              )}

              {/* Image upload widget */}
              <div
                className="border border-dashed border-border rounded-xl p-3 flex flex-col items-center gap-1 hover:border-[#1d4ed8]/40 hover:bg-[#fafbfe] transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-8 h-8 rounded-full bg-[#eef2ff] flex items-center justify-center">
                  <Upload className="w-4 h-4 text-[#1d4ed8]" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-foreground font-medium">Click to upload POD images</p>
                  {images.length > 0 && (
                    <Badge variant="outline" className="mt-1 text-[9px] px-1.5 py-0 rounded bg-emerald-50 border-emerald-200 text-emerald-700">
                      {images.length} uploaded
                    </Badge>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      Array.from(files).forEach((file) => {
                        if (file.size > 5 * 1024 * 1024) {
                          alert(`"${file.name}" exceeds the 5MB limit and will be skipped.`);
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result)
                            setImages((prev) => [...prev, ev.target.result]);
                        };
                        reader.readAsDataURL(file);
                      });
                    }
                    e.target.value = "";
                  }}
                />
              </div>

              {/* Uploaded images preview list in edit mode */}
              {images.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Uploaded Images</p>
                  <div className="flex flex-wrap gap-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative w-12 h-12 rounded border border-border overflow-hidden bg-slate-50 group">
                        <img src={img} alt="POD upload" className="w-full h-full object-cover" />
                        <div
                          className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPodViewImage(img);
                            }}
                            className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors cursor-pointer"
                            title="View Image"
                          >
                            <Eye className="w-3 h-3 text-white" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImages((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="w-5 h-5 rounded-full bg-white/20 hover:bg-red-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Receiver Name</label>
                  <input
                    type="text"
                    placeholder="Receiver's name..."
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]/20 focus:border-[#1d4ed8]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Remarks</label>
                  <input
                    type="text"
                    placeholder="Remarks..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]/20 focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-1.5">
                {!isDestDelivered && isPending && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 font-bold">
                    <Clock className="w-3 h-3" />
                    Delivery available after dispatch
                  </span>
                )}
                {!isDestDelivered && !isPending && (
                  <Button
                    className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold"
                    onClick={() => onDeliverySuccess(dest._id)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Delivery Success
                  </Button>
                )}
                {images.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1.5 h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                    onClick={() => setPodViewImage(images[0])}
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    View POD
                  </Button>
                )}
                <Button
                  className={`gap-1.5 h-8 text-xs font-bold text-white shadow-sm transition-all duration-150 ${
                    isPodSaved 
                      ? "bg-emerald-600 hover:bg-emerald-700" 
                      : "bg-[#1d4ed8] hover:bg-[#1e40af]"
                  }`}
                  disabled={images.length === 0 && !receiverName && !remarks}
                  onClick={handleSave}
                >
                  {uploading ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isPodSaved ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <FileCheck className="w-3.5 h-3.5" />
                  )}
                  {uploading ? "Saving..." : isPodSaved ? "Uploaded" : "Save POD Data"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PODSection;
