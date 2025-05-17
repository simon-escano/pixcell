import { SamplePage } from "../SamplePage";

export default async function EditSamplePage({
  params,
}: {
  params: Promise<{ sampleId: string }>;
}) {
  const sampleId = (await params).sampleId;
  return <SamplePage sampleId={sampleId} />;
}
