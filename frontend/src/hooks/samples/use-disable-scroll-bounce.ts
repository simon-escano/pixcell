import { useEffect } from "react";

export default function useDisableScrollBounce() {
  useEffect(() => {
    document.body.classList.add("no-scroll", "overflow-hidden");
    
    return () => {
      document.body.classList.remove("no-scroll", "overflow-hidden");
    };
  }, []);
}
