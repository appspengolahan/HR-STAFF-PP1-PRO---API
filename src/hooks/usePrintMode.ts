import { useState, useEffect, useCallback } from 'react';

export function usePrintMode() {
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onBeforePrint = () => setIsPrinting(true);
    const onAfterPrint = () => setIsPrinting(false);

    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, []);

  const triggerPrint = useCallback((docTitle?: string) => {
    const originalTitle = document.title;
    if (docTitle) {
      document.title = docTitle;
    }
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setIsPrinting(false);
        if (docTitle) {
          document.title = originalTitle;
        }
      }, 600);
    }, 60);
  }, []);

  return { isPrinting, triggerPrint };
}
