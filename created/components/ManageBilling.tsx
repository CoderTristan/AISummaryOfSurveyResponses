import { Button } from "@/components/ui/button";

export function ManageBilling({ userId }: { userId: string }) {
  const openPortal = async () => {
    const res = await fetch("/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <Button onClick={openPortal} variant="outline">
      Manage Billing
    </Button>
  );
}
