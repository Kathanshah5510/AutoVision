import { useEffect, useState } from 'react';

export default function Toast({ message, onClear }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (message) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        if (onClear) onClear();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [message, onClear]);

  return (
    <div
      className={`error-toast${show ? ' show' : ''}`}
      id="error-toast"
    >
      {message}
    </div>
  );
}
