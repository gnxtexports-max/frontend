import { useState, useEffect, useRef } from "react";
import { Loader2, Truck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import PlantRow from "./ShipmentRow";

export function ShipmentTable({
  filteredShipments,
  loading,
  setSelectedShipment,
  setViewSheetOpen,
  setEditShipment,
  shipmentData,
  setShipmentData,
  onDeleted,
}) {
  const tableContainerRef = useRef(null);
  const scrollbarRef = useRef(null);
  const sentinelRef = useRef(null);

  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const [showStickyScrollbar, setShowStickyScrollbar] = useState(false);
  const [positionStyle, setPositionStyle] = useState({ left: 0, width: 0 });

  // Bi-directional synchronization flags
  const isScrollingTable = useRef(false);
  const isScrollingScrollbar = useRef(false);

  const handleTableScroll = () => {
    if (isScrollingScrollbar.current) {
      isScrollingScrollbar.current = false;
      return;
    }
    if (tableContainerRef.current && scrollbarRef.current) {
      isScrollingTable.current = true;
      scrollbarRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
  };

  const handleScrollbarScroll = () => {
    if (isScrollingTable.current) {
      isScrollingTable.current = false;
      return;
    }
    if (tableContainerRef.current && scrollbarRef.current) {
      isScrollingScrollbar.current = true;
      tableContainerRef.current.scrollLeft = scrollbarRef.current.scrollLeft;
    }
  };

  // Keep track of widths and overflow changes
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    if (!tableContainer) return;

    const updateWidths = () => {
      setScrollWidth(tableContainer.scrollWidth);
      setClientWidth(tableContainer.clientWidth);
    };

    updateWidths();

    const resizeObserver = new ResizeObserver(() => {
      updateWidths();
    });
    resizeObserver.observe(tableContainer);

    const tableEl = tableContainer.querySelector("table");
    if (tableEl) {
      resizeObserver.observe(tableEl);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Determine visibility using IntersectionObserver
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const sentinel = sentinelRef.current;
    if (!tableContainer || !sentinel) return;

    let isTableVisible = false;
    let isBottomVisible = false;

    const checkVisibility = () => {
      const hasOverflow = tableContainer.scrollWidth > tableContainer.clientWidth;
      setShowStickyScrollbar(isTableVisible && !isBottomVisible && hasOverflow);
    };

    const tableObserver = new IntersectionObserver(
      ([entry]) => {
        isTableVisible = entry.isIntersecting;
        checkVisibility();
      },
      { threshold: 0 }
    );

    const sentinelObserver = new IntersectionObserver(
      ([entry]) => {
        isBottomVisible = entry.isIntersecting;
        checkVisibility();
      },
      { threshold: 0 }
    );

    tableObserver.observe(tableContainer);
    sentinelObserver.observe(sentinel);

    return () => {
      tableObserver.disconnect();
      sentinelObserver.disconnect();
    };
  }, [scrollWidth, clientWidth]);

  // Keep floating scrollbar position and width synchronized with table container rect
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    if (!tableContainer) return;

    const updatePosition = () => {
      const rect = tableContainer.getBoundingClientRect();
      setPositionStyle({
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();

    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);

    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.addEventListener("scroll", updatePosition, { passive: true });
    }

    const resizeObserver = new ResizeObserver(() => {
      updatePosition();
    });
    resizeObserver.observe(tableContainer);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
      if (mainEl) {
        mainEl.removeEventListener("scroll", updatePosition);
      }
      resizeObserver.disconnect();
    };
  }, [showStickyScrollbar]);

  // Align scrollLeft when scrollbar becomes visible
  useEffect(() => {
    if (showStickyScrollbar && scrollbarRef.current && tableContainerRef.current) {
      scrollbarRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
  }, [showStickyScrollbar]);

  return (
    <div className="bg-white rounded-lg border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex-1 overflow-hidden flex flex-col relative">
      <div
        ref={tableContainerRef}
        onScroll={handleTableScroll}
        className="flex-1 overflow-auto relative [&_[data-slot=table-container]]:overflow-x-visible"
      >
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50">
            <Loader2 className="w-6 h-6 animate-spin text-[#1d4ed8]" />
          </div>
        )}

        <Table>
          <TableHeader className="sticky top-0 z-10 bg-[#fafbfc]">
            <TableRow className="hover:bg-transparent bg-[#fafbfc]">
              <TableHead className="pl-5 w-[160px]">Shipment ID</TableHead>
              <TableHead className="w-[140px]">Plant Number</TableHead>
              <TableHead className="w-[220px]">Dealer & Location</TableHead>
              <TableHead className="w-[150px]">Items & Weight</TableHead>
              <TableHead className="w-[160px]">Driver Info</TableHead>
              <TableHead className="w-[160px]">Vehicle Info</TableHead>
              <TableHead className="w-[110px]">Date</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[110px]">POD</TableHead>
              <TableHead className="w-[60px] pr-5 text-center">View</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredShipments.map((shipment) => (
              <PlantRow
                key={shipment._id}
                shipment={shipment}
                setSelectedShipment={setSelectedShipment}
                setViewSheetOpen={setViewSheetOpen}
                setEditShipment={setEditShipment}
                shipmentData={shipmentData}
                setShipmentData={setShipmentData}
                onDeleted={onDeleted}
              />
            ))}

            {filteredShipments.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="w-8 h-8 text-muted-foreground/40" />
                    <p className="text-sm">No shipments found</p>
                    <p className="text-xs text-muted-foreground/70">Try adjusting your search or filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div ref={sentinelRef} className="h-px w-full" />

      {showStickyScrollbar && (
        <div
          ref={scrollbarRef}
          onScroll={handleScrollbarScroll}
          className="fixed bottom-0 bg-white/95 border-t border-border z-30 overflow-x-auto overflow-y-hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)] transition-opacity duration-200"
          style={{
            left: positionStyle.left,
            width: positionStyle.width,
            height: "16px",
          }}
        >
          <div style={{ width: scrollWidth, height: "1px" }} />
        </div>
      )}
    </div>
  );
}

export default ShipmentTable;