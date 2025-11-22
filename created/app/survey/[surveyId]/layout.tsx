export default function SurveyEmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white fixed inset-0 z-60">
      {children}
    </div>
  );
}
