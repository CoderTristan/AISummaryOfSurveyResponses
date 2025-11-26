import Response from "@/components/Responses";

export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <div>
      <Response projectId={projectId} />
    </div>
  );
}