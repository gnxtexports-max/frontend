import React, { useState, useRef } from "react";
import { FileCheck, Clock, Camera, FileText, Image, Eye, Printer, Upload, X, CheckCircle2, CircleDot, Circle, Disc, MapPin, Hash, Weight, ChevronRight } from "lucide-react";
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
            shipment={shipment}
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
  shipment,
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

  const handlePrintLR = () => {
    if (!shipment) return;
    const currentDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).replace(/\//g, "-");

    const vehicleNo = shipment.vehicleNumber || (typeof shipment.vehicleId === "object" ? shipment.vehicleId?.vehicleNo : "—");
    const driverName = shipment.driverName || (typeof shipment.driverId === "object" ? shipment.driverId?.name : "");
    const fromAddress = "Kottayam CFA (CEAT LTD) GNXT Power Corp, Kottayam";
    const toAddress = `${dest.customerName || "—"}, ${dest.deliveryLocation || "—"}`;
    const invoices = (dest.invoiceIds || []).filter(inv => typeof inv === "object" && inv !== null);

    // Chunk invoices into pages of maximum 9 entries
    const invoicesPerPage = 9;
    const pages = [];
    for (let i = 0; i < invoices.length; i += invoicesPerPage) {
      pages.push(invoices.slice(i, i + invoicesPerPage));
    }
    if (pages.length === 0) {
      pages.push([]);
    }

    const renderPage = (pageInvoices, pageIndex, totalPages) => {
      let totalQty = 0;
      let totalWeight = 0;
      let totalFlap = 0;
      let totalTube = 0;
      let totalTyre = 0;

      const rows = pageInvoices.map(inv => {
        const invQty = Number(inv.quantity) || 0;
        const invWt = Number(inv.weight) || 0;
        const invFlap = Number(inv.flap) || 0;
        const invTube = Number(inv.tube) || 0;
        const invTyre = Number(inv.tyre) || 0;

        totalQty += invQty;
        totalWeight += invWt;
        totalFlap += invFlap;
        totalTube += invTube;
        totalTyre += invTyre;

        const formattedDate = inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }) : "—";

        return {
          no: inv.invoiceNumber || "—",
          date: formattedDate,
          qty: invQty,
          weight: invWt.toFixed(2),
          flap: invFlap,
          tube: invTube,
          tyre: invTyre
        };
      });

      const displayLR = lrDisplay;
      const spacingClass = pageInvoices.length > 7 ? "compact" : "spacious";

      const renderCopy = () => `
        <div class="lr-copy ${spacingClass}">
          <div class="lr-copy-title-container">
            <h2 class="lr-copy-title">GNXT POWER CORP</h2>
            <div class="lr-copy-subtitle-container">
              <div class="lr-copy-subtitle">GOODS CONSIGNMENT NOTE</div>
            </div>
          </div>
          
          <div class="lr-meta-row">
            <div>LR No. &nbsp;<span class="lr-meta-lr">${displayLR}</span></div>
            <div>Vehicle No. &nbsp;<strong>${vehicleNo}</strong></div>
            <div>Date: &nbsp;<strong>${currentDate}</strong></div>
          </div>

          <div class="lr-from-to">
            <div class="lr-from">
              <strong>From :</strong> &nbsp; ${fromAddress}
            </div>
            <div class="lr-to">
              <strong>To :</strong> &nbsp; ${toAddress}
            </div>
          </div>

          <div class="lr-table-container">
            <table class="lr-table">
              <thead>
                <tr>
                  <th colspan="6" class="table-title">INVOICE DETAILS</th>
                </tr>
                <tr>
                  <th>INVOICE NO</th>
                  <th>INVOICE DATE</th>
                  <th>WEIGHT (KG)</th>
                  <th>TYRE</th>
                  <th>TUBE</th>
                  <th>FLAP</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(r => `
                  <tr>
                    <td>${r.no}</td>
                    <td>${r.date}</td>
                    <td>${r.weight}</td>
                    <td>${r.tyre}</td>
                    <td>${r.tube}</td>
                    <td>${r.flap}</td>
                  </tr>
                `).join("")}
                <tr class="total-row">
                  <td colspan="2">TOTAL</td>
                  <td>${totalWeight.toFixed(2)} kg</td>
                  <td>${totalTyre}</td>
                  <td>${totalTube}</td>
                  <td>${totalFlap}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="lr-signatures">
            <div class="lr-sig-box">
              <div class="lr-sig-label">SUPERVISOR SIGNATURE</div>
              <div class="lr-sig-dotted-line"></div>
            </div>
            <div class="lr-sig-box">
              <div class="lr-sig-label">DRIVER NAME & SIGNATURE</div>
              ${driverName ? `<div class="lr-sig-driver-name">${driverName}</div>` : ''}
              <div class="lr-sig-dotted-line"></div>
            </div>
            <div class="lr-sig-box">
              <div class="lr-sig-label">RECEIVED BY CLIENT WITH SIGNATURE AND SEAL</div>
              <div class="lr-sig-dotted-line"></div>
            </div>
            <div class="lr-sig-box">
              <div class="lr-sig-label">REMARKS</div>
              <div class="lr-sig-dotted-line"></div>
            </div>
          </div>
        </div>
      `;

      return `
        <div class="a4-page">
          ${renderCopy()}
          <div class="dashed-separator"></div>
          ${renderCopy()}
        </div>
      `;
    };

    const html = `
      <div class="lr-pdf-container">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          @page {
            size: A4 portrait;
            margin: 0;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          .lr-pdf-container {
            font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #000;
            background-color: #fff;
          }

          .a4-page {
            width: 210mm;
            height: 295mm;
            padding: 3mm 4mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-after: always;
            break-after: page;
          }

          .a4-page:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }

          .lr-copy {
            border: 1.5px solid #000;
            padding: 0;
            box-sizing: border-box;
            height: 143mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            background-color: #fff;
          }

          /* Dynamic Spacing Configuration */
          .lr-copy.spacious {
            --padding-meta-tb: 6px;
            --font-meta: 14.5px;
            --padding-fromto-tb: 6px;
            --font-fromto: 14.5px;
            --padding-table-tb: 5px;
            --font-table: 11.5px;
            --sig-height: 25mm;
            --font-sig: 9.5px;
          }

          .lr-copy.compact {
            --padding-meta-tb: 3.5px;
            --font-meta: 12.5px;
            --padding-fromto-tb: 3.5px;
            --font-fromto: 12.5px;
            --padding-table-tb: 3px;
            --font-table: 10px;
            --sig-height: 18mm;
            --font-sig: 8px;
          }

          .lr-copy-title-container {
            text-align: center;
            padding: 4px 12px;
          }

          .lr-copy-title {
            font-size: 19px;
            font-weight: 800;
            letter-spacing: 1px;
            margin: 0;
            text-transform: uppercase;
            padding-bottom: 1px;
          }

          .lr-copy-subtitle-container {
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 2px 0;
            margin-top: 1px;
          }

          .lr-copy-subtitle {
            font-size: 11.5px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
          }

          .lr-meta-row {
            display: flex;
            justify-content: space-between;
            padding: var(--padding-meta-tb) 12px;
            font-size: var(--font-meta);
            font-weight: 600;
            border-bottom: 2px solid #000;
          }

          .lr-meta-lr {
            color: #cc0000;
            font-weight: 700;
          }

          .lr-from-to {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border-bottom: 2px solid #000;
            font-size: var(--font-fromto);
            line-height: 1.4;
            font-weight: 500;
          }

          .lr-from, .lr-to {
            padding: var(--padding-fromto-tb) 12px;
            box-sizing: border-box;
          }

          .lr-from {
            border-right: 2px solid #000;
          }

          .lr-table-container {
            flex-grow: 3;
            display: flex;
            flex-direction: column;
          }

          .lr-table {
            width: 100%;
            height: 100%;
            border-collapse: collapse;
            border: none;
          }

          .lr-table th, .lr-table td {
            border: 1px solid #000;
            padding: calc(var(--padding-table-tb) + 2px) 8px;
            font-size: var(--font-table);
            text-align: center;
            line-height: 1.2;
            vertical-align: middle;
            font-weight: 500;
          }

          .lr-table th:first-child, .lr-table td:first-child {
            padding-left: 12px;
            border-left: none;
          }

          .lr-table th:last-child, .lr-table td:last-child {
            padding-right: 12px;
            border-right: none;
          }

          .lr-table th {
            background-color: #f3f4f6;
            font-weight: 700;
          }

          .lr-table thead tr:not(:first-child) th {
            font-weight: 800;
            font-size: calc(var(--font-table) + 1.5px);
          }

          .lr-table th.table-title {
            background-color: #e5e7eb;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 11.5px;
            padding: 3px 12px;
            letter-spacing: 1px;
            border-top: none;
          }

          .lr-table .total-row td {
            font-weight: 800;
            font-size: calc(var(--font-table) + 3.5px);
            background-color: #f3f4f6;
            border-bottom: none;
            padding-top: calc(var(--padding-table-tb) + 4px);
            padding-bottom: calc(var(--padding-table-tb) + 4px);
          }

          .lr-signatures {
            display: flex;
            border-top: 1px solid #000;
            height: var(--sig-height);
            box-sizing: border-box;
          }

          .lr-sig-box {
            width: 25%;
            border-right: 1px solid #000;
            padding: 4px 8px;
            font-size: var(--font-sig);
            font-weight: 700;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
          }

          .lr-sig-box:first-child {
            padding-left: 12px;
          }

          .lr-sig-box:last-child {
            border-right: none;
            padding-right: 12px;
          }

          .lr-sig-label {
            text-transform: uppercase;
            margin-bottom: 2px;
            line-height: 1.2;
          }

          .lr-sig-driver-name {
            font-weight: 700;
            font-size: calc(var(--font-sig) + 2px);
            text-transform: uppercase;
            color: #000;
            margin: 2px 0;
            text-align: center;
          }

          .lr-sig-dotted-line {
            border-bottom: 2.5px dotted #000;
            width: 90%;
            margin: 0 auto;
            height: 0;
            padding-top: 4px;
          }

          .dashed-separator {
            border-top: 2px dashed #000;
            width: 100%;
            margin: 0.5mm 0;
          }
        </style>
        ${pages.map((pageInvoices, idx) => renderPage(pageInvoices, idx, pages.length)).join("")}
      </div>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow.focus();

    const triggerPrint = () => {
      try {
        iframe.contentWindow.print();
      } catch (err) {
        console.error("Print error:", err);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }
    };

    iframe.contentWindow.onload = triggerPrint;

    // Fallback if onload does not trigger
    setTimeout(() => {
      if (iframe.parentNode) {
        triggerPrint();
      }
    }, 500);
  };

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
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#1d4ed8]">Destination {index + 1} of {totalCount}</span>
            <span className="ml-2.5 text-xs text-muted-foreground font-semibold">LR: {lrDisplay}</span>
            <button
              onClick={handlePrintLR}
              className="ml-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors cursor-pointer border border-blue-200"
            >
              <Printer className="w-3 h-3" /> Print LR
            </button>
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
            <DetailField label="Weight" value={`${Number(dest.weightKg || 0).toFixed(2)} kg`} />
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
