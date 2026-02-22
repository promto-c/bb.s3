import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Database } from 'lucide-react';

interface BreadcrumbNavProps {
  bucketName: string;
  currentPrefix: string;
  onNavigate: (prefix: string) => void;
}

const getScrollBehavior = (): ScrollBehavior => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'auto';
  }
  return 'smooth';
};

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ bucketName, currentPrefix, onNavigate }) => {
  const [showFadeLeft, setShowFadeLeft] = useState(false);
  const [showFadeRight, setShowFadeRight] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const breadcrumbs = useMemo(() => {
    const parts = currentPrefix.split('/').filter(Boolean);
    const items = [{ label: bucketName, prefix: '' }];
    let prefix = '';

    parts.forEach(part => {
      prefix += part + '/';
      items.push({ label: part, prefix });
    });

    return items;
  }, [bucketName, currentPrefix]);

  const updateFadeState = useCallback(() => {
    const nav = navRef.current;
    if (!nav) {
      setShowFadeLeft(false);
      setShowFadeRight(false);
      return;
    }

    const maxScrollLeft = nav.scrollWidth - nav.clientWidth;
    if (maxScrollLeft <= 1) {
      setShowFadeLeft(false);
      setShowFadeRight(false);
      return;
    }

    setShowFadeLeft(nav.scrollLeft > 2);
    setShowFadeRight(nav.scrollLeft < maxScrollLeft - 2);
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const rafId = requestAnimationFrame(() => {
      nav.scrollTo({ left: nav.scrollWidth, behavior: getScrollBehavior() });
      updateFadeState();
    });

    const handleResize = () => updateFadeState();
    nav.addEventListener('scroll', updateFadeState, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      nav.removeEventListener('scroll', updateFadeState);
      window.removeEventListener('resize', handleResize);
    };
  }, [breadcrumbs, updateFadeState]);

  const handleWheel = (event: React.WheelEvent<HTMLElement>) => {
    const nav = navRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth) return;

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (delta === 0) return;

    const maxScrollLeft = nav.scrollWidth - nav.clientWidth;
    const canScrollLeft = nav.scrollLeft > 1;
    const canScrollRight = nav.scrollLeft < maxScrollLeft - 1;
    const shouldHandle = (delta < 0 && canScrollLeft) || (delta > 0 && canScrollRight);

    if (!shouldHandle) return;

    event.preventDefault();
    nav.scrollBy({ left: delta, behavior: getScrollBehavior() });
    updateFadeState();
  };

  return (
    <div className="breadcrumb-shell">
      <nav
        ref={navRef}
        aria-label="Current path"
        className="breadcrumb-scroll"
        onWheel={handleWheel}
      >
        <div className="breadcrumb-track">
          {breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;

            return (
              <div key={item.prefix + idx} className="flex items-center text-xs">
                {idx > 0 && <ChevronRight className="w-4 h-4 text-[#444] mx-1.5" />}
                <button
                  onClick={() => onNavigate(item.prefix)}
                  disabled={isLast}
                  title={item.label}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-colors whitespace-nowrap ${
                    isLast
                      ? 'text-white font-semibold cursor-default'
                      : 'text-[#666] hover:text-[#ccc] hover:bg-[#222]/30'
                  }`}
                >
                  {idx === 0 && <Database className="w-3.5 h-3.5" />}
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>
      </nav>
      <span className={`breadcrumb-fade left ${showFadeLeft ? 'visible' : ''}`} />
      <span className={`breadcrumb-fade right ${showFadeRight ? 'visible' : ''}`} />
    </div>
  );
};

export default BreadcrumbNav;
