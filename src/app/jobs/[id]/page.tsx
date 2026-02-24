import JobDetailsClient from "./job-details-client";

export default function Page({ params }: { params: { id: string } }) {
  return <JobDetailsClient id={params.id} />;
}
