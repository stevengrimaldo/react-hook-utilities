// @flow
import { useCallback, useState } from 'react';
import useResize from './useResize';

/**
 * Returns a dom elements dimensions and position properties
 */
export const useRect = (ref: Object) => {
  const getRect = element => {
    if (!element) {
      return {
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0
      };
    }

    return element.getBoundingClientRect();
  };

  const [rect, setRect] = useState(getRect(ref ? ref.current : null));

  const resizeEvents = useCallback(() => {
    if (ref.current) {
      setRect(getRect(ref.current));
    }
  }, [ref]);

  useResize(resizeEvents, ref);

  return rect;
};

export default useRect;
