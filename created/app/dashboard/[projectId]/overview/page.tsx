import Overview from "@/components/Overview";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div>
      <Overview projectId={projectId} />
    </div>
  );
}