import { SamplePage } from "../sample-page";

export default async function ViewSamplePage({
  params,
}: {
  params: Promise<{ sampleId: string }>;
}) {
  const sampleId = (await params).sampleId;
  return <SamplePage sampleId={sampleId} disabled={true} />;
}
