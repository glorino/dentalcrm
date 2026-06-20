import { task } from "@trigger.dev/sdk";
import { initDB, sql } from "@/lib/db";
import { broadcastTicketUpdate } from "@/lib/events";

export const slaMonitorTask = task({
  id: "sla-monitor",
  maxDuration: 120,
  retry: { maxAttempts: 3 },
  run: async () => {
    await initDB();

    const approachingBreach = await sql`
      SELECT id, ticket_number, subject, priority, sla_due, assignee_id
      FROM tickets
      WHERE status IN ('open', 'pending')
        AND sla_due IS NOT NULL
        AND sla_due > NOW()
        AND sla_due < NOW() + INTERVAL '30 minutes'
        AND sla_status = 'ok'
    `;

    for (const ticket of approachingBreach) {
      await sql`UPDATE tickets SET sla_status = 'warning' WHERE id = ${ticket.id}`;
      broadcastTicketUpdate(ticket.id, {
        type: "sla_warning",
        ticketNumber: ticket.ticket_number,
        subject: ticket.subject,
        priority: ticket.priority,
      });
    }

    const breached = await sql`
      SELECT id, ticket_number, subject, priority, assignee_id
      FROM tickets
      WHERE status IN ('open', 'pending')
        AND sla_due IS NOT NULL
        AND sla_due < NOW()
        AND sla_status != 'breached'
    `;

    for (const ticket of breached) {
      await sql`UPDATE tickets SET sla_status = 'breached' WHERE id = ${ticket.id}`;
      broadcastTicketUpdate(ticket.id, {
        type: "sla_breached",
        ticketNumber: ticket.ticket_number,
        subject: ticket.subject,
        priority: ticket.priority,
      });
    }

    return {
      approachingBreach: approachingBreach.length,
      breached: breached.length,
      checkedAt: new Date().toISOString(),
    };
  },
});
