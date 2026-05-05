import { useState, useEffect, useCallback, useMemo } from "react";

export type HeadingItem = {
  id: string;
  text: string;
  level: number;
  element?: HTMLElement;
};

export function useDocumentOutline(containerRef: React.RefObject<HTMLElement | null>) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const extractHeadings = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const headingElements = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const items: HeadingItem[] = [];

    headingElements.forEach((el, index) => {
      const headingEl = el as HTMLElement;
      const text = headingEl.textContent?.trim() || "";
      if (!text) return;

      let id = headingEl.id;
      if (!id) {
        id = `heading-${index}-${text.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}`;
        headingEl.id = id;
      }

      items.push({
        id,
        text,
        level: parseInt(headingEl.tagName[1], 10),
        element: headingEl,
      });
    });

    setHeadings(items);
  }, [containerRef]);

  useEffect(() => {
    extractHeadings();

    const observer = new MutationObserver(() => {
      extractHeadings();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => observer.disconnect();
  }, [extractHeadings, containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || headings.length === 0) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerTop = container.getBoundingClientRect().top;

      let current: string | null = null;
      for (const heading of headings) {
        if (!heading.element) continue;
        const rect = heading.element.getBoundingClientRect();
        const relativeTop = rect.top - containerTop;

        if (relativeTop <= 80) {
          current = heading.id;
        } else {
          break;
        }
      }

      if (!current && headings.length > 0 && scrollTop < 50) {
        current = headings[0].id;
      }

      setActiveId(current);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [headings, containerRef]);

  const scrollToHeading = useCallback(
    (id: string) => {
      const container = containerRef.current;
      const heading = headings.find((h) => h.id === id);
      if (!container || !heading?.element) return;

      const containerRect = container.getBoundingClientRect();
      const headingRect = heading.element.getBoundingClientRect();
      const offset = headingRect.top - containerRect.top + container.scrollTop - 20;

      container.scrollTo({ top: offset, behavior: "smooth" });
    },
    [headings, containerRef],
  );

  const minLevel = useMemo(
    () => (headings.length > 0 ? Math.min(...headings.map((h) => h.level)) : 1),
    [headings],
  );

  return { headings, activeId, scrollToHeading, minLevel };
}
