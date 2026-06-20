import { NextResponse } from "next/server";
import { initDB, sql } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const demoUsers = [
  { email: "emeka@dentalcrm.com", password: "admin123", name: "Dr. Chukwuemeka Obi", role: "super_admin", team: "AI Operations" },
  { email: "chioma@dentalcrm.com", password: "demo123", name: "Chioma Nwosu", role: "admin", team: "Clinical Support" },
  { email: "tunde@dentalcrm.com", password: "demo123", name: "Tunde Ogunleye", role: "manager", team: "Patient Relations" },
  { email: "folake@dentalcrm.com", password: "demo123", name: "Folake Ogundipe", role: "manager", team: "Administration" },
  { email: "adaeze@dentalcrm.com", password: "demo123", name: "Dr. Adaeze Igwe", role: "agent", team: "Clinical Support" },
  { email: "ngozi@dentalcrm.com", password: "demo123", name: "Ngozi Okolo", role: "agent", team: "Patient Relations" },
  { email: "admin@dentalcrm.com", password: "demo123", name: "Emeka Anyanwu", role: "agent", team: "AI Operations" },
  { email: "bola@dentalcrm.com", password: "demo123", name: "Bola Adewale", role: "agent", team: "Administration" },
  { email: "kemi@dentalcrm.com", password: "demo123", name: "Kemi Oluwatosin", role: "agent", team: "Clinical Support" },
  { email: "dayo@dentalcrm.com", password: "demo123", name: "Dayo Fadugba", role: "viewer", team: null },
];

const demoCustomers = [
  { email: "info@thesmiledental.com", name: "The Smile Dental", company: "The Smile Dental Lagos", segment: "enterprise", plan: "enterprise", ltv: 45000000, csat: 4.8, total_tickets: 22 },
  { email: "admin@cdc.com.ng", name: "CDC Dental Centre", company: "CDC Dental", segment: "business", plan: "business", ltv: 28000000, csat: 4.6, total_tickets: 14 },
  { email: "help@smile360.com", name: "Smile 360 Dental", company: "Smile 360", segment: "pro", plan: "pro", ltv: 18000000, csat: 4.7, total_tickets: 9 },
  { email: "team@toothcraft.com", name: "ToothCraft Dental", company: "ToothCraft", segment: "enterprise", plan: "enterprise", ltv: 52000000, csat: 4.9, total_tickets: 28 },
  { email: "support@dentcare.com", name: "DentCare Nigeria", company: "DentCare", segment: "business", plan: "business", ltv: 32000000, csat: 4.5, total_tickets: 16 },
  { email: "ops@brightsmile.com", name: "BrightSmile Dental", company: "BrightSmile", segment: "pro", plan: "pro", ltv: 15000000, csat: 4.4, total_tickets: 7 },
  { email: "admin@whitefield.com", name: "Whitefield Dental", company: "Whitefield Dental", segment: "starter", plan: "starter", ltv: 4800000, csat: 4.3, total_tickets: 4 },
  { email: "team@perfectsmile.com", name: "PerfectSmile Clinic", company: "PerfectSmile", segment: "business", plan: "business", ltv: 22000000, csat: 4.7, total_tickets: 11 },
  { email: "info@dentalspot.com", name: "DentalSpot Lagos", company: "DentalSpot", segment: "pro", plan: "pro", ltv: 12000000, csat: 4.5, total_tickets: 6 },
  { email: "support@oralcare.com", name: "OralCare Nigeria", company: "OralCare", segment: "starter", plan: "starter", ltv: 3600000, csat: 4.6, total_tickets: 3 },
];

const demoKnowledgeArticles = [
  { title: "How to Book a Dental Appointment", content: "Patients can book appointments through the DentalCRM patient portal, WhatsApp, or by calling the front desk. Select the desired dentist, treatment type, and preferred time slot. The system automatically checks availability across all rooms and equipment, then sends a confirmation via SMS or WhatsApp with pre-appointment instructions. Walk-in slots are also available and will appear in real-time on the reception dashboard.", collection: "Patient Management", status: "published", views: 3421, ai_used: 234, helpful: 92, tags: ["appointment", "booking", "scheduling", "patient"] },
  { title: "Managing Patient Dental Records", content: "Dental records are centralized in the patient profile under the Clinical tab. Each record includes medical history, current medications, allergies, dental charting, treatment history, and radiograph notes. Dentists can update records in real-time during consultations, and all changes are version-controlled with timestamps. Records comply with MDCN and NDPR data retention requirements.", collection: "Patient Management", status: "published", views: 2876, ai_used: 198, helpful: 89, tags: ["records", "patient", "clinical", "documentation"] },
  { title: "Understanding Dental Insurance Coverage", content: "DentalCRM integrates with major Nigerian HMOs and insurance providers to verify patient coverage in real-time. The system displays covered procedures, co-payment amounts, annual limits, and waiting periods before treatment begins. Claims are auto-generated with the correct NCDAS codes and submitted electronically. Rejected claims are flagged with rejection reasons for quick resubmission.", collection: "Patient Management", status: "published", views: 2103, ai_used: 156, helpful: 88, tags: ["insurance", "hmo", "coverage", "billing"] },
  { title: "Configuring Treatment Plan Reminders", content: "Set up automated reminders for multi-visit treatment plans in Settings > Automation > Treatment Reminders. Configure reminder sequences for each treatment stage — for example, remind patients 48 hours before a crown fitting or 2 weeks before an orthodontic adjustment. Reminders can be sent via SMS, WhatsApp, or email, and patients can confirm or reschedule directly from the message.", collection: "Clinical Support", status: "published", views: 1987, ai_used: 143, helpful: 93, tags: ["reminders", "treatment", "automation", "notifications"] },
  { title: "How to Process Dental Claims", content: "Navigate to Billing > Insurance Claims to view pending claims. Select the patient, attach the treatment codes and supporting documents, then click Submit Claim. The system validates the claim against the patient's insurance plan and submits it electronically. Track claim status in real-time — pending, submitted, approved, or rejected — and follow up on outstanding claims from the dashboard.", collection: "Clinical Support", status: "published", views: 1654, ai_used: 121, helpful: 87, tags: ["claims", "billing", "insurance", "processing"] },
  { title: "Setting Up Post-Procedure Follow-Ups", content: "Automate follow-up communications after dental procedures in Settings > Automation > Follow-Ups. Configure templates for different procedures — extractions, root canals, cleanings — with appropriate aftercare instructions and timing. Follow-ups are sent automatically 24-72 hours post-procedure and include options for patients to report complications or schedule their next visit.", collection: "Clinical Support", status: "published", views: 1234, ai_used: 89, helpful: 86, tags: ["follow-up", "procedure", "aftercare", "automation"] },
  { title: "Understanding Orthodontic Treatment Workflows", content: "Orthodontic patients require a distinct workflow with multiple adjustment visits over 12-24 months. Create an orthodontic treatment plan with scheduled milestones — initial consultation, banding appointment, monthly adjustments, and debonding. The system tracks each stage, sends reminders for upcoming adjustments, and monitors progress with before-and-after photo comparisons stored in the patient's clinical record.", collection: "Clinical Support", status: "published", views: 987, ai_used: 76, helpful: 84, tags: ["orthodontics", "workflow", "treatment", "braces"] },
  { title: "Managing Dental Lab Orders", content: "Track lab orders from submission to delivery under Lab > Orders. When a dentist prescribes a crown, bridge, or denture, the system generates a lab order with specifications, shade, and material details. Attach intraoral scan files or impressions directly to the order. Monitor turnaround times, receive delivery notifications, and flag delays automatically to prevent patient appointment disruptions.", collection: "Clinical Support", status: "published", views: 1543, ai_used: 112, helpful: 83, tags: ["lab", "orders", "crowns", "bridges"] },
  { title: "Configuring WhatsApp for Appointment Reminders", content: "Connect your clinic's WhatsApp Business account in Settings > Channels > WhatsApp. Generate approved message templates for appointment confirmations, reminders, cancellations, and follow-ups. The system sends automated reminders 48 hours and 2 hours before appointments. Patients can reply with CONFIRM, RESCHEDULE, or CANCEL, and the appointment status updates automatically.", collection: "Integrations", status: "published", views: 4521, ai_used: 312, helpful: 95, tags: ["whatsapp", "appointment", "reminders", "messaging"] },
  { title: "Email Integration for Patient Correspondence", content: "Set up email integration in Settings > Channels > Email to connect your clinic's domain. Configure IMAP for receiving patient inquiries and SMTP for sending appointment confirmations, invoices, and treatment plans. Emails are automatically linked to the patient's record and can be classified by the AI agent for routing to the appropriate department.", collection: "Integrations", status: "published", views: 3890, ai_used: 267, helpful: 91, tags: ["email", "integration", "patient", "communication"] },
  { title: "Building a Dental Knowledge Base", content: "Create a comprehensive knowledge base covering dental procedures, insurance FAQs, clinic policies, and post-treatment care. Organize articles into collections such as Patient Education, Staff Protocols, and Insurance Guides. The AI agent uses these articles to automatically answer common patient questions, reducing front desk call volume by up to 40%.", collection: "Getting Started", status: "published", views: 2345, ai_used: 178, helpful: 89, tags: ["knowledge-base", "articles", "documentation", "content"] },
  { title: "Understanding AI-Powered Diagnosis Support", content: "DentalCRM's AI assistant analyzes dental X-rays and intraoral images to flag potential caries, periodontal issues, and bone loss. The AI provides a confidence score for each finding and suggests recommended next steps. Dentists review AI findings alongside their clinical assessment, ensuring the AI serves as a decision-support tool rather than a replacement for professional judgment.", collection: "Getting Started", status: "published", views: 5678, ai_used: 423, helpful: 96, tags: ["ai", "diagnosis", "xray", "clinical"] },
  { title: "Setting Up Multi-Location Scheduling", content: "For clinics with multiple branches, configure location-based scheduling in Settings > Locations. Each location has its own room inventory, dentist roster, and equipment availability. Patients can book at any location, and the system shows real-time availability across all branches. Centralized reporting provides consolidated analytics across the entire practice.", collection: "Scheduling & Appointments", status: "published", views: 1876, ai_used: 134, helpful: 90, tags: ["multi-location", "scheduling", "branches", "availability"] },
  { title: "Managing Dental X-Ray Integration", content: "Integrate Digital Imaging systems in Settings > Integrations > Imaging. Supported systems include panoramic, cephalometric, CBCT, and intraoral cameras. Images are automatically uploaded to the patient's record and linked to the current visit. The AI can overlay analysis annotations on images, and dentists can annotate findings directly on the digital radiograph.", collection: "Integrations", status: "published", views: 3210, ai_used: 245, helpful: 87, tags: ["xray", "imaging", "radiograph", "integration"] },
  { title: "How to Handle Emergency Dental Cases", content: "Emergency cases bypass normal scheduling queues. Use the Emergency button on the dashboard to create a priority ticket with URGENT status. The system notifies the on-call dentist via push notification and SMS, blocks an emergency slot on the schedule, and generates a preliminary intake form. Emergency records are flagged in the patient's profile for immediate access.", collection: "Scheduling & Appointments", status: "published", views: 2876, ai_used: 198, helpful: 86, tags: ["emergency", "urgent", "priority", "scheduling"] },
  { title: "Setting Up Patient Consent Forms", content: "Create digital consent forms in Settings > Forms > Consent Templates. Include procedure-specific risks, alternatives, and patient acknowledgment. Forms are sent to patients before their appointment via email or WhatsApp and can be signed electronically on a tablet at the clinic. Signed consent forms are stored in the patient's record with timestamps and IP addresses for legal compliance.", collection: "Patient Management", status: "published", views: 1654, ai_used: 121, helpful: 87, tags: ["consent", "forms", "digital", "compliance"] },
  { title: "Managing Pediatric Dental Workflows", content: "Pediatric patients require age-appropriate workflows with parental consent, behavior management notes, and shorter appointment slots. Create a pediatric patient profile linked to the parent/guardian record. Configure kid-friendly reminders, track immunization status, and use the behavior scoring system to document patient cooperation during procedures.", collection: "Clinical Support", status: "published", views: 1234, ai_used: 89, helpful: 86, tags: ["pediatric", "children", "workflow", "parental"] },
  { title: "Configuring Treatment Code Mapping", content: "Map your clinic's treatment codes to the Nigerian Current Dental Terminology (NCDAS) standard in Settings > Billing > Code Mapping. Each code links to a description, standard fee, and insurance category. The system auto-populates codes during treatment entry, ensuring consistent billing across all dentists and reducing claim rejections due to coding errors.", collection: "Clinical Support", status: "published", views: 987, ai_used: 76, helpful: 84, tags: ["codes", "billing", "ncdas", "mapping"] },
  { title: "How to Generate Clinical Reports", content: "Access Reports > Clinical to generate treatment performance, patient outcomes, and dentist productivity reports. Filter by date range, procedure type, dentist, or location. Reports include visualization charts for trends and can be exported as PDF or Excel. Scheduled reports can be emailed to practice managers weekly or monthly.", collection: "Patient Management", status: "published", views: 1543, ai_used: 112, helpful: 83, tags: ["reports", "clinical", "analytics", "export"] },
  { title: "Setting Up Patient Recall Systems", content: "Configure patient recall intervals in Settings > Automation > Recall. Set different recall periods for check-ups (6 months), cleanings (6 months), and orthodontic reviews (monthly). The system automatically generates recall lists, sends reminder messages, and flags overdue patients on the dashboard. Recall compliance rates are tracked in the Analytics section.", collection: "Scheduling & Appointments", status: "published", views: 2109, ai_used: 167, helpful: 91, tags: ["recall", "follow-up", "recalls", "automation"] },
  { title: "Managing Dental Supply Inventory", content: "Track dental supplies in Inventory > Stock. Record items like composites, impression materials, PPE, and disposables with quantity, unit cost, and reorder thresholds. When stock falls below the threshold, the system alerts the admin and can auto-generate purchase orders. Link supply usage to procedures for accurate cost-per-treatment calculations.", collection: "Administration", status: "published", views: 876, ai_used: 67, helpful: 85, tags: ["inventory", "supplies", "stock", "ordering"] },
  { title: "Understanding Dental Imaging Integration", content: "DentalCRM connects with leading imaging software to import and manage digital radiographs, CBCT scans, and intraoral photos. Images are stored in DICOM format, linked to the patient's visit record, and accessible from the clinical workstation. The AI overlays analysis results directly on images, allowing dentists to review findings in context.", collection: "Integrations", status: "published", views: 1432, ai_used: 109, helpful: 87, tags: ["imaging", "dicom", "scan", "integration"] },
  { title: "Configuring SLA for Patient Response", content: "Define response time targets in Settings > SLA Rules. Set different SLAs for appointment inquiries (30 minutes), insurance questions (2 hours), and clinical follow-ups (1 hour). Escalation triggers notify managers when SLAs are at risk or breached. SLA compliance is tracked in real-time on the Patient Relations dashboard.", collection: "Scheduling & Appointments", status: "published", views: 1654, ai_used: 123, helpful: 88, tags: ["sla", "response-time", "escalation", "patient"] },
  { title: "Data Privacy and NDPR for Dental Records", content: "DentalCRM complies with Nigeria's Data Protection Regulation (NDPR) for handling patient health data. All dental records are encrypted at rest and in transit. Patients have the right to access, rectify, and request deletion of their data. Audit trails track every access to patient records, and data processing agreements are available for all third-party integrations.", collection: "Technical Docs", status: "published", views: 2345, ai_used: 189, helpful: 91, tags: ["ndpr", "privacy", "compliance", "data-protection"] },
  { title: "Troubleshooting Appointment System Errors", content: "Common appointment system errors include double-booked slots, calendar sync failures, and SMS delivery timeouts. Check Settings > Integrations for channel connectivity status if reminders are not being sent. For booking conflicts, verify room and dentist availability in the scheduling calendar. Clear the browser cache if the appointment widget fails to load, and check API logs for external calendar sync issues.", collection: "Troubleshooting", status: "published", views: 1987, ai_used: 156, helpful: 88, tags: ["troubleshooting", "appointment", "errors", "fix"] },
  { title: "Mobile App for Dental Receptionists", content: "The DentalCRM mobile app allows receptionists to check patients in, view the daily schedule, and send quick reminders on the go. Download from the App Store or Google Play, then log in with your clinic credentials. The app supports push notifications for new bookings, patient arrivals, and urgent messages from dentists.", collection: "Getting Started", status: "published", views: 1876, ai_used: 134, helpful: 90, tags: ["mobile", "receptionist", "app", "features"] },
  { title: "How to Send Treatment Reminders via SMS", content: "Configure SMS reminders in Settings > Channels > SMS using your Termii API key. Create templates for appointment confirmations, pre-procedure instructions, and post-treatment check-ins. Schedule automated sends at optimal times — 48 hours before, 2 hours before, and 1 week after treatment. Track delivery rates and patient responses in the SMS Analytics dashboard.", collection: "Integrations", status: "published", views: 1654, ai_used: 121, helpful: 87, tags: ["sms", "reminders", "termii", "messaging"] },
  { title: "Understanding MDCN Compliance Requirements", content: "DentalCRM is designed to support compliance with the Medical and Dental Council of Nigeria (MDCN) requirements. The system maintains complete patient records, treatment documentation, and practitioner credentials. License renewal reminders, CPD point tracking, and professional indemnity record storage are built into the Administration module.", collection: "Technical Docs", status: "published", views: 1234, ai_used: 89, helpful: 86, tags: ["mdcn", "compliance", "regulatory", "license"] },
  { title: "Setting Up Patient Feedback Collection", content: "Automate patient satisfaction surveys in Settings > Automation > Feedback. Configure post-visit surveys sent via SMS or email with questions on wait time, staff friendliness, treatment explanation, and overall experience. Responses are scored, trends tracked over time, and low scores automatically escalated to the practice manager for immediate follow-up.", collection: "Patient Management", status: "published", views: 987, ai_used: 78, helpful: 85, tags: ["feedback", "survey", "satisfaction", "patient"] },
  { title: "API Integration for Dental Practice Management", content: "DentalCRM provides a REST API for integrating with external dental practice management software, lab systems, and insurance portals. Base URL: https://api.dentalcrm.com/v1. Authenticate with a Bearer token. Key endpoints include /patients, /appointments, /treatments, and /insurance-claims. SDKs are available for Python, Node.js, and PHP.", collection: "API Reference", status: "published", views: 4567, ai_used: 345, helpful: 93, tags: ["api", "integration", "practice-management", "developers"] },
];

const demoTickets = [
  { subject: "Patient missed root canal follow-up appointment", message: "Patient was scheduled for a root canal follow-up on Monday but did not show up. We need to reschedule and send a reminder to ensure attendance at the next visit.", status: "open", priority: "high", channel: "whatsapp", sentiment: "negative", sentiment_score: -0.3, ai_confidence: 94, tags: ["appointment", "follow-up", "missed"] },
  { subject: "How to book emergency dental extraction", message: "A patient with severe dental trauma needs an emergency extraction. What is the fastest way to get them on today's schedule?", status: "open", priority: "urgent", channel: "web", sentiment: "negative", sentiment_score: -0.6, ai_confidence: 91, tags: ["emergency", "extraction", "urgent"] },
  { subject: "Insurance claim for orthodontic treatment rejected", message: "The insurance claim for Patient Aisha's orthodontic treatment was rejected citing insufficient documentation. We need to review the rejection reason and resubmit with the correct NCDAS codes.", status: "escalated", priority: "medium", channel: "email", sentiment: "angry", sentiment_score: -0.5, ai_confidence: 82, tags: ["insurance", "claim", "orthodontics", "rejected"] },
  { subject: "Dental X-ray images not syncing to patient record", message: "The panoramic X-rays taken this morning are not appearing in the patient's clinical record. The imaging software shows the images but they are not pushing to DentalCRM.", status: "open", priority: "high", channel: "web", sentiment: "frustrated", sentiment_score: -0.4, ai_confidence: 88, tags: ["xray", "imaging", "sync", "technical"] },
  { subject: "Need to reschedule 15 patients for next week", message: "Due to a dentist's unplanned leave, we need to reschedule 15 patient appointments for next week. Please help batch process these changes.", status: "pending", priority: "medium", channel: "sms", sentiment: "neutral", sentiment_score: 0.0, ai_confidence: 89, tags: ["reschedule", "bulk", "scheduling"] },
  { subject: "Patient requesting treatment cost breakdown", message: "Patient wants a detailed breakdown of costs for their full-mouth rehabilitation plan including crowns, implants, and whitening before proceeding.", status: "open", priority: "low", channel: "messenger", sentiment: "neutral", sentiment_score: 0.1, ai_confidence: 96, tags: ["cost", "breakdown", "treatment-plan"] },
  { subject: "Braces adjustment appointment running behind schedule", message: "The orthodontist is running 45 minutes behind on today's adjustment appointments. We need to notify waiting patients and adjust the remaining schedule.", status: "open", priority: "high", channel: "whatsapp", sentiment: "negative", sentiment_score: -0.3, ai_confidence: 85, tags: ["orthodontics", "scheduling", "delay"] },
  { subject: "Pediatric patient needs sedation consent form", message: "A 7-year-old patient is scheduled for a pulpotomy under sedation tomorrow. The signed consent form from the parent has not been received yet.", status: "open", priority: "high", channel: "email", sentiment: "negative", sentiment_score: -0.4, ai_confidence: 90, tags: ["pediatric", "consent", "sedation", "urgent"] },
  { subject: "Lab order for dental crown delayed", message: "The lab order for Patient Chukwu's zirconia crown was submitted 5 days ago but the lab has not delivered. The patient's crown seating appointment is in 2 days.", status: "escalated", priority: "urgent", channel: "web", sentiment: "angry", sentiment_score: -0.7, ai_confidence: 72, tags: ["lab", "crown", "delay", "urgent"] },
  { subject: "Insurance verification not completing for new patient", message: "The insurance verification for new patient Fatima Bello is stuck in pending status. The HMO portal shows her policy is active but DentalCRM is not pulling the verification response.", status: "open", priority: "medium", channel: "web", sentiment: "neutral", sentiment_score: -0.2, ai_confidence: 91, tags: ["insurance", "verification", "new-patient", "technical"] },
];

export async function POST() {
  try {
    await initDB();

    for (const user of demoUsers) {
      const hash = await hashPassword(user.password);
      await sql`
        INSERT INTO users (email, password_hash, name, role, team)
        VALUES (${user.email}, ${hash}, ${user.name}, ${user.role}, ${user.team})
        ON CONFLICT (email) DO NOTHING
      `;
    }

    const customerIds: string[] = [];
    for (const c of demoCustomers) {
      const result = await sql`
        INSERT INTO customers (email, name, company, segment, plan, ltv, csat, total_tickets)
        VALUES (${c.email}, ${c.name}, ${c.company}, ${c.segment}, ${c.plan}, ${c.ltv}, ${c.csat}, ${c.total_tickets})
        ON CONFLICT (email) DO UPDATE SET name = ${c.name}
        RETURNING id
      `;
      customerIds.push(result[0].id);
    }

    const users = await sql`SELECT id, email FROM users`;
    const userIdMap: Record<string, string> = {};
    for (const u of users) userIdMap[u.email] = u.id;

    for (let i = 0; i < demoTickets.length; i++) {
      const t = demoTickets[i];
      const customerId = customerIds[i % customerIds.length];
      const assigneeId = userIdMap["emeka@dentalcrm.com"];
      const ticketNumber = `DNT-${1234 - i}`;
      const slaDue = new Date(Date.now() + (t.priority === "urgent" ? 3600000 : t.priority === "high" ? 7200000 : 14400000));

      await sql`
        INSERT INTO tickets (ticket_number, subject, message, status, priority, channel, customer_id, assignee_id, sentiment, sentiment_score, ai_confidence, sla_status, sla_due, tags)
        VALUES (${ticketNumber}, ${t.subject}, ${t.message}, ${t.status}, ${t.priority}, ${t.channel}, ${customerId}, ${assigneeId}, ${t.sentiment}, ${t.sentiment_score}, ${t.ai_confidence}, 'ok', ${slaDue.toISOString()}, ${t.tags})
        ON CONFLICT (ticket_number) DO NOTHING
      `;
    }

    const adminUserId = userIdMap["emeka@dentalcrm.com"];
    await sql`DELETE FROM knowledge_articles`;
    for (const article of demoKnowledgeArticles) {
      await sql`
        INSERT INTO knowledge_articles (title, content, collection, status, views, ai_used, helpful, tags, created_by)
        VALUES (${article.title}, ${article.content}, ${article.collection}, ${article.status}, ${article.views}, ${article.ai_used}, ${article.helpful}, ${article.tags}, ${adminUserId})
      `;
    }

    return NextResponse.json({
      message: "Database seeded successfully",
      logins: {
        admin: "emeka@dentalcrm.com / admin123",
        manager: "tunde@dentalcrm.com / demo123",
        agent: "adaeze@dentalcrm.com / demo123",
        viewer: "dayo@dentalcrm.com / demo123",
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}
