import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllDoctors } from '@/db/queries/select';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const doctors = await getAllDoctors();
  res.status(200).json(doctors);
} 