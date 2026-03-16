import ApplyJobClient from "./apply-job-client";

export default async function ApplyJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApplyJobClient jobId={id} />;
}
