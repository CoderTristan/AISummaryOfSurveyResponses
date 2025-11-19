export default async function OverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Project Overview</h1>
      <p>Project ID: {projectId}</p>
    </div>
  );
}