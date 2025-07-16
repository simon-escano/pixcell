'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/auth-helpers-nextjs';

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  // add other fields if needed
};

export default function ReportsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // eslint-disable-next-line no-alert
      alert('Supabase environment variables are missing! Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.');
    }
    const supabase = createClientComponentClient();
    supabase.auth.getSession().then(({ data, error }) => {
      console.log('Supabase session:', data?.session, 'Error:', error);
      setUser(data?.session?.user || null);
      setChecking(false);
    });
  }, []);

  useEffect(() => {
    // Fetch patients from your API
    async function fetchPatients() {
      const res = await fetch('/api/patients');
      const data = await res.json();
      setPatients(data);
    }
    fetchPatients();
  }, []);

  const handleCreateClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowForm(true);
    setForm({ title: '', content: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // POST to your API to create the report
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        patientId: selectedPatient?.id,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success && data.reportId) {
      // Redirect to the new report's edit page
      router.push(`/reports/${data.reportId}`);
    }
  };

  return (
    <div>
      {checking ? (
        <div>Loading...</div>
      ) : !user ? (
        <div>Please log in to view reports.</div>
      ) : (
        <>
          <h1>Reports</h1>
          <ul>
            {patients.map((patient) => (
              <li key={patient.id}>
                {patient.firstName} {patient.lastName}
                <button onClick={() => handleCreateClick(patient)} style={{ marginLeft: 8 }}>
                  Create Report
                </button>
              </li>
            ))}
          </ul>

          {showForm && (
            <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
              <h2>Create Report for {selectedPatient?.firstName} {selectedPatient?.lastName}</h2>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Title"
                required
                style={{ display: 'block', marginBottom: 8 }}
              />
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Content"
                required
                rows={6}
                style={{ display: 'block', marginBottom: 8 }}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Report'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ marginLeft: 8 }}>
                Cancel
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
