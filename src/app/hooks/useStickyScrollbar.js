import { useState, useEffect, useRef } from "react";

export function useStickyScrollbar(deps = []) {
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
  }, deps);

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
  }, [scrollWidth, clientWidth, ...deps]);

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

    let parent = tableContainer.parentElement;
    const scrollParents = [];
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (["auto", "scroll"].includes(style.overflowY) || ["auto", "scroll"].includes(style.overflow)) {
        scrollParents.push(parent);
        parent.addEventListener("scroll", updatePosition, { passive: true });
      }
      parent = parent.parentElement;
    }

    const resizeObserver = new ResizeObserver(() => {
      updatePosition();
    });
    resizeObserver.observe(tableContainer);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
      scrollParents.forEach((p) => p.removeEventListener("scroll", updatePosition));
      resizeObserver.disconnect();
    };
  }, [showStickyScrollbar, ...deps]);

  // Align scrollLeft when scrollbar becomes visible
  useEffect(() => {
    if (showStickyScrollbar && scrollbarRef.current && tableContainerRef.current) {
      scrollbarRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
  }, [showStickyScrollbar]);

  return {
    tableContainerRef,
    scrollbarRef,
    sentinelRef,
    scrollWidth,
    showStickyScrollbar,
    positionStyle,
    handleTableScroll,
    handleScrollbarScroll,
  };
}
