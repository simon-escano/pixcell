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
  role: "Patient";
  imageUrl: string | null;
  birthDate: string;
  sex: string;
  contactNumber: string;
  email: string;
  address: string;
  height: number;
  weight: number;
  bloodType: string;
  createdAt: Date;
  createdBy: string | null;
};
