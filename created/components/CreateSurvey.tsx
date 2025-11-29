"use client";

import { useCreateSurveyLogic } from "./CreateSurveyLogic";
import CreateSurveyUI from "./CreateSurveyUI";

export default function CreateSurvey() {
  const logic = useCreateSurveyLogic();
  return <CreateSurveyUI {...logic} />;
}
