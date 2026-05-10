import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const DashboardSidebar = ({ open, onToggle, children }) => {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const evaluate = () => setDesktop(window.innerWidth >= 1280);
    evaluate();
    window.addEventListener("resize", evaluate);
    return () => window.removeEventListener("resize", evaluate);
  }, []);

  return (
    <aside className="col-span-12 xl:col-span-4">
      <div className="mb-3 flex items-center justify-between xl:hidden">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Tools</p>
        <Button type="button" variant="outline" size="sm" onClick={onToggle}>
          {open ? "Hide panels" : "Show panels"}
        </Button>
      </div>

      {(open || desktop) ? <div className="space-y-4 animate-in fade-in-0 duration-200">{children}</div> : null}
    </aside>
  );
};

export default DashboardSidebar;
