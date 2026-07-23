import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import PlantRow from "./PlantRow";

export function InvoiceTable({
  invoices,
  loading,
  currentPage,
  totalPages,
  total,
  onPageChange,
  onDeleted,
  onStatusUpdated,
  onEditClick,
  canEdit,
  canDelete,
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
    <div className="flex-1 min-h-0 bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col relative">
      <div
        ref={tableContainerRef}
        onScroll={handleTableScroll}
        className="overflow-auto flex-1 relative [&_[data-slot=table-container]]:overflow-x-visible"
      >
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50">
            <Loader2 className="w-6 h-6 animate-spin text-[#1d4ed8]" />
          </div>
        )}

        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8 pl-4" />
              <TableHead>Plant No.</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Tyres</TableHead>
              <TableHead>Tubes</TableHead>
              <TableHead>Flaps</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Before Dispatch Remarks</TableHead>
              <TableHead>After Dispatch Remarks</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 && !loading ? (
              <TableRow>
                <TableCell
                  colSpan={15}
                  className="h-[300px] text-center"
                >
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((plant) => (
                <PlantRow
                  key={plant._id}
                  plant={plant}
                  onDeleted={onDeleted}
                  onStatusUpdated={onStatusUpdated}
                  onEditClick={onEditClick}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              ))
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

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
        <p className="text-xs text-muted-foreground">
          Page{" "}
          <span className="font-medium text-foreground">
            {currentPage}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {totalPages}
          </span>{" "}
          —{" "}
          <span className="font-medium text-foreground">
            {total}
          </span>{" "}
          plants
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange((p) => p - 1)}
          >
            Prev
          </Button>

          {Array.from(
            {
              length: Math.min(5, totalPages),
            },
            (_, i) => {
              const page =
                Math.max(
                  1,
                  Math.min(currentPage - 2, totalPages - 4)
                ) + i;

              return (
                <Button
                  key={page}
                  size="sm"
                  variant={
                    currentPage === page ? "default" : "outline"
                  }
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              );
            }
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={
              currentPage === totalPages || totalPages === 0
            }
            onClick={() => onPageChange((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InvoiceTable;