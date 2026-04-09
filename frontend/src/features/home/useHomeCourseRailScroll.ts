import { useCallback, useEffect, useRef, useState } from 'react';

const getScrollDistance = (viewportWidth: number) => Math.max(viewportWidth * 0.72, 260);

export default function useHomeCourseRailScroll(courseCount: number) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(courseCount > 4);

  const updateScrollState = useCallback(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
    setCanScrollLeft(viewport.scrollLeft > 6);
    setCanScrollRight(maxScrollLeft - viewport.scrollLeft > 6);
  }, []);

  useEffect(() => {
    updateScrollState();

    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    viewport.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      viewport.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const scrollByViewport = (direction: 'left' | 'right') => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    viewport.scrollBy({
      left:
        direction === 'left'
          ? -getScrollDistance(viewport.clientWidth)
          : getScrollDistance(viewport.clientWidth),
      behavior: 'smooth',
    });
  };

  return {
    canScrollLeft,
    canScrollRight,
    scrollByViewport,
    viewportRef,
  };
}
