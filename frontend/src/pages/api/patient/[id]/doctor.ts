import type { NextApiRequest, NextApiResponse } from 'next';
import { getDoctorForPatient } from '@/db/queries/select';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing id' });
  const doctorId = await getDoctorForPatient(id);
  res.status(200).json({ doctorId });
} 