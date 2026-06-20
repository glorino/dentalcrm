type EventCallback = (data: Record<string, unknown>) => void;

const clients = new Set<ReadableStreamDefaultController>();
const eventListeners = new Map<string, Set<EventCallback>>();

export function addClient(controller: ReadableStreamDefaultController) {
  clients.add(controller);
  return () => clients.delete(controller);
}

export function broadcast(event: string, data: Record<string, unknown>) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of Array.from(clients)) {
    try {
      client.enqueue(new TextEncoder().encode(payload));
    } catch {
      clients.delete(client);
    }
  }

  const listeners = eventListeners.get(event);
  if (listeners) {
    for (const cb of Array.from(listeners)) {
      try { cb(data); } catch {}
    }
  }
}

export function broadcastTicketUpdate(ticketId: string, data: Record<string, unknown>) {
  broadcast("ticket-updated", { ticketId, ...data });
}

export function broadcastInboxUpdate(data: Record<string, unknown>) {
  broadcast("inbox-updated", data);
}

export function broadcastAgentActivity(data: Record<string, unknown>) {
  broadcast("agent-activity", data);
}

export function onEvent(event: string, callback: EventCallback) {
  if (!eventListeners.has(event)) eventListeners.set(event, new Set());
  eventListeners.get(event)!.add(callback);
  return () => eventListeners.get(event)?.delete(callback);
}

export function getClientCount() {
  return clients.size;
}
