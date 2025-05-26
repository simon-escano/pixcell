import { SamplePageWrapper } from "@/components/samples/sample-area/sample-page-wrapper";

export default async function ViewSamplePage({
  params,
}: {
  params: Promise<{ sampleId: string }>;
}) {
  const sampleId = (await params).sampleId;
  return <SamplePageWrapper sampleId={sampleId} disabled={true} />;
}
