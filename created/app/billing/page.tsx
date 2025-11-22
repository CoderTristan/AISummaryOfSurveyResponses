import { ManageBilling } from "@/components/ManageBilling";
import { auth } from "@clerk/nextjs/server";

export default async function BillingPage() {
  const { userId } = await auth();

  return (
    <div className="pt-24 px-8">
      <ManageBilling userId={userId!} />
    </div>
  );
}
