import Base from "@/components/base";
import { Loader2 } from "lucide-react";

export default function SettingsLoading() {
  return (
    <Base>
      <div className="container max-w-screen-lg mx-auto p-6 md:p-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    </Base>
  );
}

