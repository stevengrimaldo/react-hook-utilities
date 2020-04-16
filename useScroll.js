// @flow
import { useCallback, useEffect } from 'react';

/**
 * A performance based scroll handler
 */
let top: number = 0;
let scrollId: AnimationFrameID;

export const useScroll = (callback: Function) => {
  const scrollUpdate = useCallback(() => {
    if (window) {
      if (window.scrollY) {
        top = window.scrollY;
      } else {
        top = window.pageYOffset;
      }
    } else if (document) {
      if (document.documentElement) {
        top = document.documentElement.scrollTop;
      } else if (document.body) {
        top = document.body.scrollTop;
      }
    }

    callback(top);

    scrollId = requestAnimationFrame(scrollUpdate);
  }, [callback]);

  const onScroll = useCallback(
    e => {
      if (!scrollId) {
        scrollId = requestAnimationFrame(scrollUpdate);
      }
    },
    [scrollUpdate]
  );

  useEffect(() => {
    scrollUpdate();

    window.addEventListener('scroll', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(scrollId);
    };
  }, [onScroll, scrollUpdate]);
};

export default useScroll;
