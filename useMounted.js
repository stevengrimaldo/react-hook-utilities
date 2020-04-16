// @flow
import { useEffect, useState } from 'react';

/**
 * Returns a state value representing if the component has mounted
 */
const useMounted = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), [setMounted]);
  return mounted;
};

export default useMounted;
