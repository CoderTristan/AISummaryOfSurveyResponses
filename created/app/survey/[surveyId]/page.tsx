import PublicSurvey from "@/components/Survey";

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
    const {surveyId} = await params
  return (
    <div>
      <PublicSurvey surveyId={surveyId} />
    </div>
  );
}
