import Base from "@/components/base";
import { Spinner } from "@/components/ui/spinner";

export default function Page() {
  return (
    <Base>
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 p-4 md:p-12">
        <Spinner size={"large"}>
          <span className="text-muted-foreground">Loading...</span>
        </Spinner>
      </div>
    </Base>
  );
}
