"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReportViewPage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      router.push(`/reports/view/${encodeURIComponent(code)}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">View Report by Code</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Enter report code"
          className="border rounded px-3 py-2 flex-1"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={!code.trim()}
        >
          View
        </button>
      </form>
    </div>
  );
}
