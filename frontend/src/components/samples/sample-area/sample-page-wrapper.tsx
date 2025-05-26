import Base from "@/components/base";
import LiveblocksWrapper from "@/components/samples/liveblocks-wrapper";
import {
  getPatientById,
  getProfileByUserId,
  getRoleById,
  getSampleById,
} from "@/db/queries/select";
import { SamplePage } from "./sample-page";

interface SamplePageProps {
  sampleId: string;
  disabled?: boolean;
}

export async function SamplePageWrapper({
  sampleId,
  disabled = false,
}: SamplePageProps) {
  const sample = await getSampleById(sampleId);
  const patient = await getPatientById(sample.patientId);
  const profile = await getProfileByUserId(sample.uploadedBy);
  const role = await getRoleById(profile.roleId);
  const roomName = `sample_${sampleId}`;

  return (
    <LiveblocksWrapper>
      <Base>
        <SamplePage roomName={roomName} sample={sample} patient={patient} profile={profile} role={role} disabled={disabled}/>
      </Base>
    </LiveblocksWrapper>
  );
}
