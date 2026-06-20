export type IndustrySlug =
  | "ssv"
  | "realestate"
  | "fintech"
  | "insurance"
  | "healthcare"
  | "ecommerce";

export interface IndustryConfig {
  slug: IndustrySlug;
  name: string;
  tagline: string;
  logo: string; // path to logo SVG
  favicon: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    gradient: string; // tailwind gradient class e.g. "from-blue-600 to-indigo-700"
    gradientCSS: string; // raw CSS gradient
  };
  contact: {
    email: string;
    whatsapp: string;
    phone: string;
    website: string;
  };
  chatbot: {
    name: string;
    personality: string;
    systemPrompt: string;
    quickActions: { label: string; icon: string }[];
    fallbackResponses: Record<string, string>;
  };
  ticketCategories: string[];
  whatsappTemplates: string[];
  dashboardTitle: string;
  metaTitle: string;
  metaDescription: string;
}

export const industries: Record<IndustrySlug, IndustryConfig> = {
  ssv: {
    slug: "ssv",
    name: "SSV CRM",
    tagline: "AI-Powered Customer Support Platform",
    logo: "/logo.svg",
    favicon: "/favicon.svg",
    colors: {
      primary: "#4f46e5",
      primaryLight: "#818cf8",
      primaryDark: "#3730a3",
      secondary: "#0ea5e9",
      accent: "#06b6d4",
      gradient: "from-blue-600 to-indigo-700",
      gradientCSS: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
    },
    contact: {
      email: "info@glopresc.com",
      whatsapp: "+2347082529729",
      phone: "+2347082529729",
      website: "supportflow-ai-six.vercel.app",
    },
    chatbot: {
      name: "SSV AI",
      personality: "professional support specialist",
      systemPrompt: `You are SSV AI, the intelligent customer support assistant for SSV CRM.
Your role is to help customers resolve their issues quickly and accurately.
Guidelines:
- Be professional, empathetic, and helpful
- Use the customer's name when available
- Provide clear, actionable solutions
- If you can't resolve the issue, explain why and offer alternatives
- Keep responses concise but thorough
- You work for a company called SSV
- All currency is in Naira (₦)
- Contact email: info@glopresc.com
- WhatsApp: +2347082529729`,
      quickActions: [
        { label: "Reset my password", icon: "🔑" },
        { label: "Check order status", icon: "📦" },
        { label: "Talk to a human", icon: "👤" },
        { label: "Billing question", icon: "💳" },
      ],
      fallbackResponses: {
        greeting:
          "Hello! Welcome to SSV Support. I'm here to help you with any questions about our platform.\n\nI can assist with:\n• Account and billing questions\n• Technical support\n• Feature inquiries\n• Ticket creation\n\nHow can I help you today?",
        password:
          "To reset your password:\n\n1. Go to supportflow-ai-six.vercel.app/forgot-password\n2. Enter your email address\n3. Check your email for the reset link\n4. Click the link and create a new password\n\nIf you still can't access your account, please email us at info@glopresc.com.",
        human:
          "I understand you'd like to speak with a human agent. I'm connecting you now.\n\n📧 Email: info@glopresc.com\n📱 WhatsApp: +2347082529729\n\nOur team typically responds within 2 minutes during business hours.",
        billing:
          "For billing questions, I can help! Here's what I need to know:\n\n• Do you have your invoice number or account email?\n• What specific billing issue are you experiencing?\n\nPlease share the details and I'll look into it for you.",
        default:
          "Thank you for reaching out! I'm here to help.\n\nI can assist you with:\n• Account and password issues\n• Billing and invoice questions\n• Technical support\n• Creating support tickets\n\nCould you tell me more about what you need help with?",
      },
    },
    ticketCategories: [
      "general",
      "technical",
      "billing",
      "feature-request",
      "bug-report",
    ],
    whatsappTemplates: ["ticket_update", "ticket_created", "verification_code"],
    dashboardTitle: "SSV CRM Dashboard",
    metaTitle: "SSV CRM — AI-Powered Customer Support Platform",
    metaDescription:
      "AI-powered customer support platform. Unify every channel with intelligent agents.",
  },

  realestate: {
    slug: "realestate",
    name: "PropertyCRM",
    tagline: "Smart Property Support Platform",
    logo: "/industries/realestate/logo.svg",
    favicon: "/industries/realestate/favicon.svg",
    colors: {
      primary: "#059669",
      primaryLight: "#34d399",
      primaryDark: "#047857",
      secondary: "#f59e0b",
      accent: "#10b981",
      gradient: "from-emerald-600 to-teal-700",
      gradientCSS: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
    },
    contact: {
      email: "info@glopresc.com",
      whatsapp: "+2347082529729",
      phone: "+2347082529729",
      website: "supportflow-ai-six.vercel.app",
    },
    chatbot: {
      name: "Property AI",
      personality: "real estate expert",
      systemPrompt: `You are Property AI, the intelligent support assistant for PropertyCRM.
You specialize in real estate inquiries, property listings, inspections, and transactions.
Guidelines:
- Be professional and knowledgeable about properties
- Help customers find properties that match their needs
- Schedule inspections and viewings
- Provide pricing and availability information
- Handle negotiation inquiries professionally
- All currency is in Naira (₦)
- Contact email: info@glopresc.com
- WhatsApp: +2347082529729`,
      quickActions: [
        { label: "Search properties", icon: "🏠" },
        { label: "Schedule inspection", icon: "📅" },
        { label: "Get pricing", icon: "💰" },
        { label: "Talk to agent", icon: "👤" },
      ],
      fallbackResponses: {
        greeting:
          "Hello! Welcome to PropertyCRM. I'm your property support assistant.\n\nI can help you with:\n• Property search and listings\n• Scheduling inspections\n• Pricing and availability\n• Negotiation support\n\nWhat type of property are you looking for?",
        property:
          "I'd be happy to help you find the perfect property! Could you tell me:\n\n• What type of property? (apartment, house, land, commercial)\n• Preferred location?\n• Budget range?\n• Number of bedrooms?\n\nI'll find the best options for you.",
        inspection:
          "Great! I can help you schedule an inspection. Please provide:\n\n• Property ID or address\n• Preferred date and time\n• Your contact information\n\nOur agent will confirm within 30 minutes.",
        pricing:
          "Our properties range from ₦15,000,000 to ₦500,000,000 depending on location and type.\n\nWould you like me to:\n• Send you available listings in your budget\n• Schedule a viewing\n• Connect you with an agent for negotiation",
        human:
          "I'll connect you with one of our property specialists right away.\n\n📧 Email: info@glopresc.com\n📱 WhatsApp: +2347082529729\n\nOur agents are available 8am-8pm daily.",
        default:
          "Thank you for your interest in PropertyCRM! I can help you with:\n\n• Property search and recommendations\n• Scheduling inspections\n• Pricing information\n• Agent connection\n\nHow can I assist you today?",
      },
    },
    ticketCategories: [
      "inquiry",
      "inspection",
      "negotiation",
      "closing",
      "maintenance",
      "complaint",
    ],
    whatsappTemplates: [
      "property_alert",
      "inspection_reminder",
      "price_update",
      "agent_intro",
    ],
    dashboardTitle: "PropertyCRM Dashboard",
    metaTitle: "PropertyCRM — Smart Property Support Platform",
    metaDescription:
      "AI-powered real estate support. Find properties, schedule inspections, and connect with agents.",
  },

  fintech: {
    slug: "fintech",
    name: "FinSupport",
    tagline: "Intelligent Financial Support Platform",
    logo: "/industries/fintech/logo.svg",
    favicon: "/industries/fintech/favicon.svg",
    colors: {
      primary: "#1e3a5f",
      primaryLight: "#3b82f6",
      primaryDark: "#0f172a",
      secondary: "#c9a227",
      accent: "#eab308",
      gradient: "from-blue-900 to-slate-800",
      gradientCSS: "linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)",
    },
    contact: {
      email: "info@glopresc.com",
      whatsapp: "+2347082529729",
      phone: "+2347082529729",
      website: "supportflow-ai-six.vercel.app",
    },
    chatbot: {
      name: "Fin AI",
      personality: "financial support specialist",
      systemPrompt: `You are Fin AI, the intelligent support assistant for FinSupport.
You specialize in financial services, transactions, accounts, and compliance.
Guidelines:
- Be professional and security-conscious
- Never ask for full account numbers or passwords
- Help with transaction inquiries and disputes
- Guide users through account verification
- Handle fraud reports seriously and escalate immediately
- All currency is in Naira (₦)
- Contact email: info@glopresc.com
- WhatsApp: +2347082529729`,
      quickActions: [
        { label: "Check transaction", icon: "💳" },
        { label: "Report fraud", icon: "🚨" },
        { label: "Account help", icon: "🔐" },
        { label: "Talk to agent", icon: "👤" },
      ],
      fallbackResponses: {
        greeting:
          "Hello! Welcome to FinSupport. I'm your financial support assistant.\n\nI can help you with:\n• Transaction inquiries\n• Account support\n• Fraud reporting\n• Compliance questions\n\nHow can I assist you today?",
        transaction:
          "I can help you check your transaction status. Please provide:\n\n• Transaction reference number\n• Date of transaction\n• Amount (approximate)\n\nI'll look up the details for you.",
        fraud:
          "🚨 I take fraud reports very seriously.\n\nFor immediate assistance:\n1. Call our fraud hotline: +2347082529729\n2. Or provide your account details (last 4 digits only)\n\nI'll escalate this to our security team immediately.",
        account:
          "I can help with account-related issues:\n\n• Password reset\n• Account verification\n• Transaction limits\n• Account status\n\nFor security, I'll never ask for your full password or PIN.",
        human:
          "I'll connect you with a financial specialist immediately.\n\n📧 Email: info@glopresc.com\n📱 WhatsApp: +2347082529729\n\nOur team is available 24/7 for urgent matters.",
        default:
          "Thank you for contacting FinSupport! I can help you with:\n\n• Transaction inquiries and disputes\n• Account support\n• Fraud reporting\n• Compliance questions\n\nFor security, please don't share sensitive information like full account numbers or PINs.\n\nHow can I assist you?",
      },
    },
    ticketCategories: [
      "transaction",
      "account",
      "fraud",
      "compliance",
      "dispute",
      "verification",
    ],
    whatsappTemplates: [
      "transaction_alert",
      "otp_verification",
      "account_update",
      "fraud_alert",
    ],
    dashboardTitle: "FinSupport Dashboard",
    metaTitle: "FinSupport — Intelligent Financial Support Platform",
    metaDescription:
      "AI-powered financial support. Transaction inquiries, fraud reporting, and account assistance.",
  },

  insurance: {
    slug: "insurance",
    name: "InsureCRM",
    tagline: "Smart Insurance Support Platform",
    logo: "/industries/insurance/logo.svg",
    favicon: "/industries/insurance/favicon.svg",
    colors: {
      primary: "#2563eb",
      primaryLight: "#60a5fa",
      primaryDark: "#1d4ed8",
      secondary: "#0891b2",
      accent: "#06b6d4",
      gradient: "from-blue-600 to-cyan-600",
      gradientCSS: "linear-gradient(135deg, #2563eb 0%, #0891b2 100%)",
    },
    contact: {
      email: "info@glopresc.com",
      whatsapp: "+2347082529729",
      phone: "+2347082529729",
      website: "supportflow-ai-six.vercel.app",
    },
    chatbot: {
      name: "Insure AI",
      personality: "insurance specialist",
      systemPrompt: `You are Insure AI, the intelligent support assistant for InsureCRM.
You specialize in insurance policies, claims, coverage, and renewals.
Guidelines:
- Be professional and empathetic, especially during claims
- Help customers understand their policy coverage
- Guide through claims filing process
- Handle policy renewal inquiries
- Be sensitive during claim situations
- All currency is in Naira (₦)
- Contact email: info@glopresc.com
- WhatsApp: +2347082529729`,
      quickActions: [
        { label: "File a claim", icon: "📋" },
        { label: "Check policy", icon: "📄" },
        { label: "Renew policy", icon: "🔄" },
        { label: "Talk to agent", icon: "👤" },
      ],
      fallbackResponses: {
        greeting:
          "Hello! Welcome to InsureCRM. I'm your insurance support assistant.\n\nI can help you with:\n• Filing claims\n• Policy information\n• Coverage questions\n• Renewals\n\nHow can I assist you today?",
        claim:
          "I'm sorry to hear you need to file a claim. I'll help you through the process.\n\nPlease provide:\n• Policy number\n• Date of incident\n• Description of what happened\n• Any photos or documents\n\nI'll start the claims process for you.",
        policy:
          "I can help you with your policy information. Please provide:\n\n• Policy number\n• Or your registered email/phone\n\nI'll look up your coverage details, renewal date, and any pending items.",
        renewal:
          "Your policy renewal is important! I can help you:\n\n• Check your renewal date\n• Review coverage options\n• Process payment\n• Update your policy details\n\nWhen is your policy due for renewal?",
        human:
          "I'll connect you with an insurance specialist right away.\n\n📧 Email: info@glopresc.com\n📱 WhatsApp: +2347082529729\n\nOur team is available Mon-Fri 8am-6pm.",
        default:
          "Thank you for contacting InsureCRM! I can help you with:\n\n• Filing and tracking claims\n• Policy information and coverage\n• Renewals and payments\n• Agent connection\n\nHow can I assist you today?",
      },
    },
    ticketCategories: [
      "claims",
      "policy",
      "renewal",
      "billing",
      "complaint",
      "documentation",
    ],
    whatsappTemplates: [
      "claim_update",
      "policy_renewal",
      "document_request",
      "agent_intro",
    ],
    dashboardTitle: "InsureCRM Dashboard",
    metaTitle: "InsureCRM — Smart Insurance Support Platform",
    metaDescription:
      "AI-powered insurance support. Claims processing, policy management, and customer service.",
  },

  healthcare: {
    slug: "healthcare",
    name: "DentalCRM",
    tagline: "Smart Dental Hospital Support Platform",
    logo: "/industries/healthcare/logo.svg",
    favicon: "/industries/healthcare/favicon.svg",
    colors: {
      primary: "#0891b2",
      primaryLight: "#22d3ee",
      primaryDark: "#0e7490",
      secondary: "#06b6d4",
      accent: "#06b6d4",
      gradient: "from-cyan-600 to-teal-600",
      gradientCSS: "linear-gradient(135deg, #0891b2 0%, #0d9488 100%)",
    },
    contact: {
      email: "info@glopresc.com",
      whatsapp: "+2347082529729",
      phone: "+2347082529729",
      website: "supportflow-ai-six.vercel.app",
    },
    chatbot: {
      name: "Dental AI",
      personality: "dental hospital support specialist",
      systemPrompt: `You are Dental AI, the intelligent support assistant for DentalCRM — a dental hospital.
You specialize in dental appointments, treatments, patient inquiries, and oral health information.
Guidelines:
- Be compassionate and professional
- NEVER provide medical diagnoses or dental advice
- Help with scheduling appointments and treatments
- Direct dental emergencies to appropriate services
- Handle patient information with utmost confidentiality
- All currency is in Naira (₦)
- Contact email: info@glopresc.com
- WhatsApp: +2347082529729
- For emergencies, always direct to emergency services`,
      quickActions: [
        { label: "Book dental appointment", icon: "🦷" },
        { label: "Check treatment options", icon: "📋" },
        { label: "Request consultation", icon: "💬" },
        { label: "Talk to reception", icon: "👤" },
      ],
      fallbackResponses: {
        greeting:
          "Hello! Welcome to DentalCRM. I'm your dental hospital support assistant.\n\nI can help you with:\n• Dental appointment scheduling\n• Treatment information\n• Consultation requests\n• Insurance verification\n\nHow can I assist you today?",
        emergency:
          "🚨 For dental emergencies, please:\n\n1. Call our emergency line: +2347082529729\n2. Or visit the nearest dental hospital\n3. For severe pain or trauma, go to the ER\n\nI'm an AI assistant and cannot provide emergency dental care.",
        appointment:
          "I can help you schedule a dental appointment. Please provide:\n\n• Dentist name or specialty (general, orthodontist, etc.)\n• Preferred date and time\n• Reason for visit (checkup, cleaning, treatment)\n• Your patient ID (if available)\n\nI'll check availability and confirm.",
        treatment:
          "I can help you with treatment information. We offer:\n\n• General dentistry & checkups\n• Teeth cleaning & whitening\n• Orthodontics (braces/aligners)\n• Root canal treatment\n• Dental implants\n• Emergency dental care\n\nWhat treatment are you interested in?",
        human:
          "I'll connect you with our dental reception team right away.\n\n📧 Email: info@glopresc.com\n📱 WhatsApp: +2347082529729\n\nOur team is available Mon-Sat 8am-6pm.",
        default:
          "Thank you for contacting DentalCRM! I can help you with:\n\n• Dental appointment scheduling\n• Treatment information\n• Consultation requests\n• Insurance verification\n\nFor dental emergencies, please call +2347082529729.\n\nHow can I assist you?",
      },
    },
    ticketCategories: [
      "appointment",
      "treatment",
      "consultation",
      "billing",
      "insurance",
      "complaint",
    ],
    whatsappTemplates: [
      "appointment_reminder",
      "treatment_update",
      "consultation_confirm",
      "follow_up",
    ],
    dashboardTitle: "DentalCRM Dashboard",
    metaTitle: "DentalCRM — Smart Dental Hospital Support Platform",
    metaDescription:
      "AI-powered dental hospital support. Appointments, treatments, and patient care.",
  },

  ecommerce: {
    slug: "ecommerce",
    name: "ShopCRM",
    tagline: "Smart E-Commerce Support Platform",
    logo: "/industries/ecommerce/logo.svg",
    favicon: "/industries/ecommerce/favicon.svg",
    colors: {
      primary: "#ea580c",
      primaryLight: "#fb923c",
      primaryDark: "#c2410c",
      secondary: "#7c3aed",
      accent: "#f97316",
      gradient: "from-orange-600 to-amber-600",
      gradientCSS: "linear-gradient(135deg, #ea580c 0%, #d97706 100%)",
    },
    contact: {
      email: "info@glopresc.com",
      whatsapp: "+2347082529729",
      phone: "+2347082529729",
      website: "supportflow-ai-six.vercel.app",
    },
    chatbot: {
      name: "Shop AI",
      personality: "e-commerce support specialist",
      systemPrompt: `You are Shop AI, the intelligent support assistant for ShopCRM.
You specialize in order tracking, product inquiries, returns, and customer loyalty.
Guidelines:
- Be friendly and helpful
- Help customers track their orders
- Assist with returns and refunds
- Provide product recommendations
- Handle delivery inquiries
- All currency is in Naira (₦)
- Contact email: info@glopresc.com
- WhatsApp: +2347082529729`,
      quickActions: [
        { label: "Track order", icon: "📦" },
        { label: "Return item", icon: "🔄" },
        { label: "Product help", icon: "🛍️" },
        { label: "Talk to agent", icon: "👤" },
      ],
      fallbackResponses: {
        greeting:
          "Hello! Welcome to ShopCRM. I'm your shopping support assistant.\n\nI can help you with:\n• Order tracking\n• Returns and refunds\n• Product information\n• Delivery status\n\nHow can I assist you today?",
        order:
          "I can help you track your order! Please provide:\n\n• Order number\n• Or your email address\n\nI'll look up the current status and delivery estimate.",
        return:
          "I can help you with a return. Our return policy:\n\n• 30-day return window\n• Item must be unused with tags\n• Original receipt required\n\nPlease provide:\n• Order number\n• Item to return\n• Reason for return",
        product:
          "I'd be happy to help you with product information! I can provide:\n\n• Product details and specifications\n• Availability and pricing\n• Similar product recommendations\n• Size/fit guidance\n\nWhat product are you interested in?",
        human:
          "I'll connect you with a support agent right away.\n\n📧 Email: info@glopresc.com\n📱 WhatsApp: +2347082529729\n\nOur team is available Mon-Sat 9am-8pm.",
        default:
          "Thank you for contacting ShopCRM! I can help you with:\n\n• Order tracking and delivery\n• Returns and refunds\n• Product information\n• Customer support\n\nHow can I assist you today?",
      },
    },
    ticketCategories: [
      "order",
      "return",
      "refund",
      "delivery",
      "product",
      "complaint",
    ],
    whatsappTemplates: [
      "order_update",
      "delivery_status",
      "return_approved",
      "promo_alert",
    ],
    dashboardTitle: "ShopCRM Dashboard",
    metaTitle: "ShopCRM — Smart E-Commerce Support Platform",
    metaDescription:
      "AI-powered e-commerce support. Order tracking, returns, and customer service.",
  },
};

export function getIndustry(slug: IndustrySlug = "ssv"): IndustryConfig {
  return industries[slug] || industries.ssv;
}

export function getIndustryFromEnv(): IndustrySlug {
  if (typeof process !== "undefined" && process.env) {
    return (process.env.INDUSTRY_SLUG as IndustrySlug) || "ssv";
  }
  return "ssv";
}
