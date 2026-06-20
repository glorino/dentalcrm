import { addClient } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  let controller: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      ctrl.enqueue(new TextEncoder().encode("event: connected\ndata: {}\n\n"));
      addClient(controller);
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
