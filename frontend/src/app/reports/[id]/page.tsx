"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Report = { title: string; content: string; doctorId: string; /* add other fields as needed */ };

export default function ReportPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params?.id;
  const [report, setReport] = useState<Report | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchReportAndUser() {
      setLoading(true);
      setError("");
      try {
        // Fetch report data
        const res = await fetch(`/api/reports/${reportId}`);
        if (!res.ok) throw new Error("Failed to fetch report");
        const data = await res.json();
        setReport(data);
        setForm({ title: data.title, content: data.content });

        // Fetch current user
        const supabase = createClientComponentClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          setCanEdit(false);
        } else {
          setCanEdit(data.doctorId === userData.user.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    if (reportId) fetchReportAndUser();
  }, [reportId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        body: JSON.stringify(form),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to save report");
      // Optionally refetch or update state
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    // Simple PDF export using jsPDF (if installed)
    if (typeof window !== "undefined") {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.text(form.title, 10, 10);
      doc.text(form.content, 10, 20);
      doc.save(`${form.title || "report"}.pdf`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!report) return <div>Report not found.</div>;

  return (
    <div>
      <h1>Edit Report</h1>
      {canEdit ? (
        <form onSubmit={e => e.preventDefault()}>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            style={{ display: "block", marginBottom: 8, width: 300 }}
          />
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder="Content"
            rows={10}
            style={{ display: "block", marginBottom: 8, width: 500 }}
          />
          <button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={handleExport} style={{ marginLeft: 8 }}>
            Export as PDF
          </button>
        </form>
      ) : (
        <div>
          <h2>{report.title}</h2>
          <p>{report.content}</p>
          <p>You do not have permission to edit this report.</p>
        </div>
      )}
    </div>
  );
} 