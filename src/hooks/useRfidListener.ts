import { useEffect, useRef } from 'react';

interface UseRfidListenerOptions {
  onScan: (rfidCode: string) => void;
  enabled?: boolean;
}

export function useRfidListener({ onScan, enabled = true }: UseRfidListenerOptions) {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const fastKeyCountRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Reset buffer if delay between keystrokes is larger than 120ms (human typing)
      if (timeDiff > 120) {
        bufferRef.current = '';
        fastKeyCountRef.current = 0;
      } else {
        fastKeyCountRef.current += 1;
      }

      if (e.key === 'Enter') {
        const scanned = bufferRef.current.trim();
        // Hardware RFID scanners send rapid bursts of characters (length >= 3)
        if (scanned.length >= 3) {
          e.preventDefault();
          e.stopPropagation();

          // If an input/textarea was focused and accidentally received the scanned text, clean it up
          const target = e.target as HTMLElement | null;
          if (target && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
            if (target.getAttribute('data-rfid-input') !== 'true' && target.value.endsWith(scanned)) {
              const previousVal = target.value;
              target.value = previousVal.slice(0, previousVal.length - scanned.length);
              // Dispatch input event so React state syncs properly with the cleaned value
              target.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }

          onScanRef.current(scanned);
          bufferRef.current = '';
          fastKeyCountRef.current = 0;
        }
      } else if (e.key.length === 1) {
        // Append printable characters to the scanner buffer
        bufferRef.current += e.key;
      }
    };

    // Use capturing phase so we intercept before input/form handlers
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled]);
}

