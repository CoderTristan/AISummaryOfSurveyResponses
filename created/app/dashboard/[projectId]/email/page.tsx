import EmailSettings from "@/components/Email";

export default async function EmailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <div>
      <EmailSettings projectId={projectId} />
    </div>
  );
}