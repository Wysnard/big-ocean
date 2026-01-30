import { createFileRoute, redirect } from "@tanstack/react-router";
import { TherapistChat } from "@/components/TherapistChat";
// TODO: Migrate to Effect-ts RPC - see use-assessment.ts for pattern
// import { orpc } from "@/orpc/client";
const orpc = { chat: { startTherapistAssessment: async () => ({ id: 'temp-session' }) } } as any; // Temporary placeholder
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/chat/")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      sessionId: (search.sessionId as string) || undefined,
    };
  },
  beforeLoad: async (context) => {
    const { search } = context;

    if (!search.sessionId) {
      const session = await orpc.chat.startTherapistAssessment({});
      throw redirect({
        to: "/chat",
        search: { sessionId: session.id },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { sessionId } = Route.useSearch();

  if (!sessionId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Creating assessment session...</p>
        </div>
      </div>
    );
  }

  return <TherapistChat sessionId={sessionId} />;
}
