import { useEffect, useRef, useState } from "react";
import { Map, Building2, MapPin, Truck, CheckCircle2, Radio } from "lucide-react";
import { SectionLabel, TrackingRow } from "../ui/ShipmentUIComponents";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's broken default icon paths when bundled with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ── Custom truck SVG marker ── */
function makeTruckIcon(isMoving) {
  const color = isMoving ? "#1d4ed8" : "#ef4444";
  const pulse = isMoving
    ? `<circle cx="20" cy="20" r="18" fill="${color}" opacity="0.12">
         <animate attributeName="r"       from="14" to="22" dur="1.5s" repeatCount="indefinite"/>
         <animate attributeName="opacity" from="0.25" to="0" dur="1.5s" repeatCount="indefinite"/>
       </circle>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    ${pulse}
    <circle cx="20" cy="20" r="14" fill="${color}" stroke="white" stroke-width="2.5"/>
    <g transform="translate(9,11)" fill="white">
      <rect x="0" y="4" width="13" height="8" rx="1.5"/>
      <path d="M13 5.5 L20 5.5 L20 12 L13 12 Z"/>
      <circle cx="4"  cy="13.5" r="2.2" fill="white"/>
      <circle cx="16" cy="13.5" r="2.2" fill="white"/>
    </g>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -24] });
}

/* ── Route diagram shown when no GPS data ── */
function RouteDiagram({ shipment }) {
  return (
    <div className="bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] border border-[#c7d7fe] rounded-xl flex flex-col items-center justify-center min-h-[300px] p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="flex items-center gap-6">
          {/* Warehouse */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-[#1d4ed8] flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] text-[#4338ca]">Warehouse</span>
          </div>

          {/* Route line */}
          <div className="flex items-center gap-1">
            <div className="w-16 h-0.5 bg-[#6366f1]/30 rounded" />
            <div className="w-3 h-3 rounded-full bg-[#6366f1]/40 animate-pulse" />
            <div className="w-16 h-0.5 bg-[#6366f1]/30 rounded" />
            {shipment.status === "In Transit" && (
              <>
                <div className="w-6 h-6 rounded-full bg-[#1d4ed8]/80 flex items-center justify-center shadow-sm">
                  <Truck className="w-3 h-3 text-white" />
                </div>
                <div className="w-12 h-0.5 bg-[#6366f1]/20 rounded" />
              </>
            )}
            <div className="w-16 h-0.5 bg-[#6366f1]/20 rounded" />
          </div>

          {/* Dealer */}
          <div className="flex flex-col items-center gap-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${shipment.status === "Delivered" ? "bg-emerald-500" : "bg-[#6366f1]/30"}`}>
              <MapPin className={`w-5 h-5 ${shipment.status === "Delivered" ? "text-white" : "text-[#4338ca]"}`} />
            </div>
            <span className="text-[10px] text-[#4338ca]">Dealer</span>
          </div>
        </div>

        <p className="text-xs text-[#6366f1]/70 mt-2">
          {shipment.status === "Delivered"
            ? "Route completed"
            : shipment.status === "In Transit"
            ? "Vehicle en route — GPS fix pending"
            : "Awaiting dispatch"}
        </p>
        {shipment.status === "In Transit" && (
          <p className="text-[10px] text-[#6366f1]/50 text-center max-w-[220px]">
            Live map will appear here once the GPS device transmits its first location
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Live Leaflet map ── */
function LiveMap({ lat, lng, vehicleNo, vehicleStatus, accuracy, speed, heading, fixTime }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);
  const circleRef    = useRef(null);
  const isMoving     = vehicleStatus === "Moving";
  const accRadius    = accuracy === 3 ? 8 : accuracy === 2 ? 35 : 120;

  /* Init map once */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, { center: [lat, lng], zoom: 15, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
      maxZoom: 19,
    }).addTo(mapRef.current);
    return () => {
      mapRef.current?.remove();
      mapRef.current = markerRef.current = circleRef.current = null;
    };
  }, []); // eslint-disable-line

  /* Update marker + circle when GPS data changes */
  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;

    /* Accuracy circle */
    if (circleRef.current) circleRef.current.remove();
    circleRef.current = L.circle([lat, lng], {
      radius: accRadius, color: isMoving ? "#1d4ed8" : "#ef4444",
      fillColor: isMoving ? "#1d4ed8" : "#ef4444", fillOpacity: 0.08, weight: 1.5,
    }).addTo(mapRef.current);

    /* Truck marker */
    const icon   = makeTruckIcon(isMoving);
    const fixStr = fixTime
      ? new Date(fixTime).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : "—";
    const popup = `
      <div style="font-family:system-ui;font-size:12px;min-width:170px;line-height:1.7">
        <div style="font-weight:600;font-size:13px;margin-bottom:4px;color:#111">${vehicleNo}</div>
        <div style="color:#6b7280">Speed: <b style="color:#111">${speed != null ? speed.toFixed(1) : "—"} km/h</b></div>
        <div style="color:#6b7280">Status: <b style="color:${isMoving ? "#16a34a" : "#dc2626"}">${vehicleStatus ?? "—"}</b></div>
        <div style="color:#6b7280">Heading: <b style="color:#111">${heading != null ? heading.toFixed(1) + "°" : "—"}</b></div>
        <div style="color:#9ca3af;font-size:11px;margin-top:3px">Fix: ${fixStr}</div>
        <div style="color:#9ca3af;font-size:11px">${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E</div>
      </div>`;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]).setIcon(icon);
      markerRef.current.getPopup()?.setContent(popup);
    } else {
      markerRef.current = L.marker([lat, lng], { icon })
        .addTo(mapRef.current)
        .bindPopup(popup, { maxWidth: 230 })
        .openPopup();
    }

    mapRef.current.setView([lat, lng], mapRef.current.getZoom(), { animate: true, duration: 0.8 });
  }, [lat, lng, vehicleStatus, accuracy, speed, heading, fixTime, isMoving, accRadius, vehicleNo]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-[#c7d7fe]"
      style={{ height: "300px" }}
    />
  );
}

/* ── Main export ── */
export function TrackingSection({ shipment, detail }) {
  const tracking = detail?.tracking ?? {};
  const hasLive  = !!tracking.isLive && tracking.rawLat != null && tracking.rawLng != null;

  return (
    <div>
      <SectionLabel icon={<Map className="w-4 h-4" />} title="Location & GPS Tracking" />

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Left — map (3 cols) */}
        <div className="lg:col-span-3">
          {hasLive ? (
            <LiveMap
              lat={tracking.rawLat}
              lng={tracking.rawLng}
              vehicleNo={shipment.vehicleNumber || "Vehicle"}
              vehicleStatus={tracking.vehicleStatus}
              accuracy={tracking.accuracy}
              speed={tracking.rawSpeed}
              heading={tracking.heading}
              fixTime={tracking.fixTime}
            />
          ) : (
            <RouteDiagram shipment={shipment} />
          )}
        </div>

        {/* Right — info panel (2 cols) */}
        <div className="lg:col-span-2">
          {shipment.status === "Delivered" ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col items-center gap-3 h-full justify-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-sm text-emerald-800">Delivered Successfully</p>
                <p className="text-xs text-emerald-600 mt-1">
                  {detail?.timeline?.find((t) => t.step === "Delivered")?.timestamp ?? "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-xl divide-y divide-border h-full flex flex-col">
              {/* Panel header */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className={`w-3.5 h-3.5 ${hasLive ? "text-emerald-500" : "text-[#1d4ed8]"}`} />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    {hasLive ? "Live Tracking" : "Tracking"}
                  </span>
                </div>
                {hasLive ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    LIVE · GPS
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                    Awaiting GPS
                  </span>
                )}
              </div>

              <TrackingRow label="Current Location"  value={tracking.currentLocation ?? "—"} />
              <TrackingRow label="Last Updated"       value={tracking.lastUpdated      ?? "—"} />
              <TrackingRow label="Speed"              value={tracking.speed            ?? "—"} />

              {hasLive && (
                <>
                  <TrackingRow
                    label="GPS Accuracy"
                    value={tracking.accuracy === 3 ? "High (±5 m)" : tracking.accuracy === 2 ? "Moderate (±30 m)" : "Low (±100 m)"}
                  />
                  <TrackingRow
                    label="Satellites"
                    value={tracking.satellites != null ? `${tracking.satellites} in view` : "—"}
                  />
                  <TrackingRow
                    label="Heading"
                    value={tracking.heading != null ? `${tracking.heading.toFixed(1)}° (${compassDir(tracking.heading)})` : "—"}
                  />
                  <TrackingRow
                    label="Altitude"
                    value={tracking.altitude != null ? `${tracking.altitude.toFixed(1)} m` : "—"}
                  />
                </>
              )}

              <TrackingRow label="ETA" value={tracking.eta ?? "—"} highlight />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function compassDir(deg) {
  return ["N","NE","E","SE","S","SW","W","NW"][Math.round(deg / 45) % 8];
}

export default TrackingSection;
