import Base from "@/components/base";
import { Loader2 } from "lucide-react";

export default function OrganizationLoading() {
  return (
    <Base>
      <div className="h-full overflow-y-auto">
        <div className="flex flex-1 flex-col items-center justify-center min-h-[400px] p-4 md:p-10">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading organization...</p>
          </div>
        </div>
      </div>
    </Base>
  );
}

