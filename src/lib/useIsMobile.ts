import { useEffect, useState } from 'react';

/**
 * Returns true when the viewport is at or below `breakpoint` px.
 * Used to switch the inline-styled layouts to mobile variants
 * (inline styles can't use CSS media queries).
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);

  return isMobile;
}
