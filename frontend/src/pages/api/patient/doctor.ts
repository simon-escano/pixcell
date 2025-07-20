import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db';
import { doctorPatient } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { patientId, doctorId } = req.body;
    if (!patientId || !doctorId) {
      return res.status(400).json({ error: 'Missing patientId or doctorId' });
    }
    try {
      // Remove any existing doctor assignment for this patient
      await db.delete(doctorPatient).where(eq(doctorPatient.patientId, patientId));
      // Insert new doctor assignment
      await db.insert(doctorPatient).values({ patientId, doctorId });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to assign doctor', details: (error as Error).message });
    }
  } else if (req.method === 'GET') {
    // Fallback to previous GET handler if needed
    const { patientId } = req.query;
    if (!patientId || typeof patientId !== 'string') return res.status(400).json({ error: 'Missing patientId' });
    // ... optionally implement GET logic here ...
    return res.status(501).json({ error: 'GET not implemented' });
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 