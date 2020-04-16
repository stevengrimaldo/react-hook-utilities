// @flow
import { useCallback, useEffect } from 'react';

/**
 * A performance based resize handler which also takes into consideration for orientation change on devices.
 */
let resizeId: AnimationFrameID;

export const useResize = (callback: Function, ref?: any) => {
  const resizeUpdate = useCallback(() => {
    callback();

    resizeId = requestAnimationFrame(resizeUpdate);
  }, [callback]);

  const handleResize = useCallback(() => {
    if (!resizeId) {
      resizeId = requestAnimationFrame(resizeUpdate);
    }
  }, [resizeUpdate]);

  const handleOrientation = useCallback(() => {
    // After orientationchange, add a one-time resize event
    const afterOrientationChange = () => {
      handleResize();
      // Remove the resize event listener after it has executed
      window.removeEventListener('resize', afterOrientationChange);
    };
    window.addEventListener('resize', afterOrientationChange);
  }, [handleResize]);

  useEffect(() => {
    if (ref && !ref.current) {
      return;
    }

    handleResize();

    if (typeof ResizeObserver === 'function' && ref && ref.current) {
      let resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(ref.current);

      return () => {
        if (!resizeObserver) {
          return;
        }

        resizeObserver.disconnect();
        resizeObserver = null;
      };
    } else {
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleOrientation, {
        passive: true
      });

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleOrientation, {
          passive: true
        });
        cancelAnimationFrame(resizeId);
      };
    }
  }, [handleOrientation, handleResize, ref]);
};

export default useResize;
