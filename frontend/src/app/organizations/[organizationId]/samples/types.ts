export type Metadata = {
  type: string;
  width: number;
  height: number;
};

export type MetaSample = {
  id: string;
  sampleName: string | null;
  patient: MetaPatient | undefined;
  createdBy: MetaProfile | undefined;
  createdAt?: string;
};

export type MetaSampleImage = {
  id: string;
  sampleId: string | null;
  uploadedBy: MetaProfile | null;
  capturedAt: string;
  imageUrl: string | null;
  metadata: {
    type: string;
    width: number;
    height: number;
  };
};

export type MetaProfile = {
  id: string;
  fullName: string;
  role: string;
  imageUrl: string | null;
}

export type MetaPatient = {
  id: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  role: "Patient";
  imageUrl: string | null;
  birthDate: string | null;
  sex: string;
  contactNumber: string | null;
  email: string | null;
  address: string | null;
  height: number | null;
  weight: number | null;
  bloodType: string | null;
  createdAt: Date | string;
  createdBy: string | null;
};

export function isMetaPatient(obj: any): obj is MetaPatient {
  return (
    obj &&
    typeof obj === "object" &&
    obj.role === "Patient" &&
    typeof obj.id === "string" &&
    typeof obj.fullName === "string" &&
    typeof obj.email === "string" &&
    obj.createdAt instanceof Date
  );
}
