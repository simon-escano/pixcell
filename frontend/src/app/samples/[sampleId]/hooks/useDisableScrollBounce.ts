import { useEffect } from "react";

export default function useDisableScrollBounce() {
  useEffect(() => {
    // Disable scroll bounce on window to make the panning work properly
    document.body.classList.add("no-scroll");
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("no-scroll");
      document.body.classList.remove("overflow-hidden");
    };
  }, []);
}
