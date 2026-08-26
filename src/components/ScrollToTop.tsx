import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // When the route path changes, instantly snap the scrollbar to the very top
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}
