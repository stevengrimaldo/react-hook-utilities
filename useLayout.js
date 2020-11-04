// @flow
import { useCallback, useEffect, useState } from 'react';

// setup initial state values
let rect = {
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0,
};
let screen = {
  height: 0,
  width: 0,
};
let scroll = {
  x: 0,
  y: 0,
};
let mouse = {
  x: 0,
  y: 0,
};
let hover: boolean = false;
let inView: boolean = false;
const initState = {
  hover,
  inView,
  mouse,
  rect,
  screen,
  scroll,
};
let rafId;

const getRect = (el: HTMLElement) => {
  const specs = el.getBoundingClientRect();

  return {
    ...specs,
    // $FlowFixMe
    x: specs.x,
    // $FlowFixMe
    y: specs.y,
  };
};

// 0-1 value
const elCushion = 0;

// pixel values
const offsetTop = 0;
const offsetLeft = 0;
const offsetBottom = 0;
const offsetRight = 0;

const isInView = (el: HTMLElement): boolean => {
  if (!document || !document.documentElement || !window) return false;

  // get the html element
  const html: HTMLElement = document.documentElement;

  // Get the elements dimensions and position
  const { bottom, height, left, right, top, width } = getRect(el);

  // Set container sizes
  const cHeight = window ? window.innerHeight : html.clientHeight;
  const cWidth = window ? window.innerWidth : html.clientWidth;

  // Set container positions
  const cTop = 0;
  const cLeft = 0;
  const cBottom = cHeight - offsetBottom;
  const cRight = cWidth - offsetRight;

  // Get elements height & width + set visible offset
  const elHeight = height;
  const elWidth = width;
  const elOffsetHeight = cTop + elHeight * elCushion;
  const elOffsetWidth = cLeft + elWidth * elCushion;

  // Set the elements top, left, right and bottom points
  const elTop = top;
  const elLeft = left;
  const elBottom = bottom;
  const elRight = right;

  // Get elements positions minus offsets
  const eTop = elTop + elOffsetHeight - offsetTop;
  const eLeft = elLeft + elOffsetWidth - offsetLeft;
  const eBottom = elBottom - offsetBottom;
  const eRight = elRight - offsetRight;

  // Set shorthand checks
  const inVertically = eTop <= cBottom && eBottom >= elOffsetHeight;
  const inHorizontally = eLeft <= cRight && eRight >= elOffsetWidth;

  // Return true or false
  return inHorizontally && inVertically;
};

export const useLayout = (ref: HTMLElement): Object => {
  const [coords, setCoords]: Object = useState(initState);

  const getMouseCoords = useCallback(
    e => {
      rect = getRect(ref);

      mouse = {
        x: e.clientX,
        y: e.clientY,
      };

      if (
        mouse.x >= rect.x &&
        mouse.y >= rect.y &&
        mouse.x <= rect.x + rect.width &&
        mouse.y <= rect.y + rect.height
      ) {
        hover = true;
      } else {
        hover = false;
      }

      setCoords(prev => ({
        ...prev,
        hover,
        mouse: { ...prev.mouse, ...mouse },
      }));
    },
    [ref]
  );

  const updateLayout = useCallback(
    e => {
      if (!document || !document.documentElement || !window) return;

      // get the html element
      const html = document.documentElement;
      const hasWindowOffset = window && window.pageXOffset !== undefined;
      const x = hasWindowOffset ? window.pageXOffset : html.scrollLeft;
      const y = hasWindowOffset ? window.pageYOffset : html.scrollTop;
      const height = window ? window.innerHeight : html.clientHeight;
      const width = window ? window.innerWidth : html.clientWidth;

      scroll = {
        x,
        y,
      };

      screen = {
        height,
        width,
      };

      inView = isInView(ref);
      rect = getRect(ref);

      setCoords(prev => ({
        ...prev,
        inView,
        rect,
        screen: { ...prev.screen, ...screen },
        scroll: { ...prev.scroll, ...scroll },
      }));
    },
    [ref]
  );

  const onResize = useCallback(
    e => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => updateLayout(e));
    },
    [updateLayout]
  );

  const onOrientation = useCallback(
    e => {
      // After orientationchange, add a one-time resize event
      const afterOrientationChange = () => {
        onResize(e);
        // Remove the resize event listener after it has executed
        window.removeEventListener('resize', afterOrientationChange);
      };
      window.addEventListener('resize', afterOrientationChange);
    },
    [onResize]
  );

  const onScroll = useCallback(
    e => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(e => updateLayout(e));
    },
    [updateLayout]
  );

  const onMove = useCallback(
    e => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => getMouseCoords(e));
    },
    [getMouseCoords]
  );

  useEffect(() => {
    if (ref) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('scroll', onScroll);
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', onOrientation);

      updateLayout();
    }

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrientation);

      cancelAnimationFrame(rafId);
    };
  }, [onMove, onResize, onOrientation, onScroll, ref, updateLayout]);

  return coords;
};

export default useLayout;
