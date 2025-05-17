import Base from "@/components/base";
import { Dashboard } from "@/components/dashboard";

export default function Page() {
  return (
    <Base>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Dashboard />
      </div>
    </Base>
  );
}
