import Base from "@/components/base";
import { Dashboard } from "@/components/dashboard/dashboard";

export default function Page() {
  return (
    <Base>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-12">
        <Dashboard />
      </div>
    </Base>
  );
}
