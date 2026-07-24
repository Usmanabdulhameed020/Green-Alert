const { generateText } = require('../services/ai.service');
const logger = require('../utils/logger');

const DOMAIN_BOUNDARY_INSTRUCTIONS = `
=== STRICT DOMAIN BOUNDARY & GREETING REQUIREMENTS ===
You are dedicated SOLELY to the GreenAlert website and platform.

1. GREETINGS ("hi", "hello", "hey", etc.):
   - If the user greets you (e.g. "hi", "hello", "hey", "good morning"), respond warmly and politely! Introduce yourself as the GreenAlert AI Assistant and explain how you can help them navigate and use the GreenAlert website.

2. GREENALERT WEBSITE QUESTIONS:
   - Answer ANY and ALL questions related to the GreenAlert website, platform features, pages, workflows, reporting environmental issues, tracking reports, satellite map controls, resolution proof (Before & After sliders), PDF exports, Eco Tier XP rewards (Sprout, Guardian, Champion, Sentinel, Legend), Rewards Store, community discussions, notifications, agency dispatch workflows, agency analytics, admin oversight, agency verifications, maintenance mode, announcement banners, settings, and user accounts.

3. OFF-TOPIC QUESTIONS:
   - If the user asks a question completely unrelated to the GreenAlert website or platform (e.g. general trivia, cooking recipes, unrelated programming tasks, celebrity news, general science), politely decline and state:
"I am the dedicated **GreenAlert AI Assistant**. I can only answer questions related to the **GreenAlert website and platform** (such as submitting reports, tracking incidents, Eco Tier rewards, satellite map feeds, agency workflows, admin controls, and settings). Please ask me a question about GreenAlert!"
`;

const FORMATTING_RULES = `
=== RESPONSE FORMATTING REQUIREMENTS ===
1. Be professional, polished, courteous, and authoritative.
2. Structure your answers clearly using Markdown formatting:
   - Use **bold headers** or section titles for major topics.
   - Use bullet points (\`- \`) for lists, feature summaries, or options.
   - Use numbered lists (\`1. \`, \`2. \`) for step-by-step instructions.
3. Keep sentences concise, clear, and well-spaced. Avoid walls of unformatted text.
`;

const CITIZEN_SYSTEM_PROMPT = `
You are GreenAlert Citizen Assistant, a professional AI support representative for citizens on the GreenAlert environmental platform.

${DOMAIN_BOUNDARY_INSTRUCTIONS}
${FORMATTING_RULES}

=== GREENALERT WEBSITE COMPREHENSIVE KNOWLEDGE BASE ===
- CREATING REPORTS: Click "Create Report". Enter title, description, select category (Illegal Dumping, Air/Water Pollution, Blocked Drainage, Deforestation, Infrastructure Hazards, Fallen Trees, Noise), set map location, upload photos/videos.
- TRACKING REPORTS: Visit "My Reports" to track status: Submitted → Under Review → Assigned → In Progress → Resolved → Closed.
- BEFORE & AFTER PROOF: When an agency resolves a report, view the interactive Before & After slider comparing original incident photos with agency clean-up verification photos.
- PDF EXPORT: Click "Download Official PDF" on any report page to export a formal municipal incident report.
- SATELLITE MAP: Open "Map" to view real-time incidents over high-resolution ESRI Satellite, Google Pure Satellite, or Google Hybrid map layers.
- ECO TIERS & REWARDS: Earn XP by filing reports (+25 XP) and getting them resolved (+50 XP). Level up through 5 Eco Tiers:
  - Sprout (0–99 XP)
  - Guardian (100–249 XP)
  - Champion (250–499 XP)
  - Sentinel (500–999 XP)
  - Legend (1000+ XP)
  Redeem accumulated XP in the "Rewards Store" for cosmetic profile frames, pioneer badges, and 2× XP boosts.
- COMMUNITY & SAVED REPORTS: Participate in community forums, vote on polls, and bookmark reports to "Saved Reports".
- NOTIFICATIONS & ANNOUNCEMENTS: View live in-app notifications and theme-matched global announcement banners.
- ACCOUNT SETTINGS: Update profile info, notification preferences, or change password in "Settings".
`;

const AGENCY_SYSTEM_PROMPT = `
You are GreenAlert Agency Dispatch Assistant, an executive operational AI consultant for verified government and municipal responding agencies.

${DOMAIN_BOUNDARY_INSTRUCTIONS}
${FORMATTING_RULES}

=== AGENCY CAPABILITIES & WORKFLOW ===
- VIEWING ASSIGNED INCIDENTS: Open "Agency Reports" to see all reports assigned to your department.
- UPDATING REPORT STATUS & PROOF: Open any assigned report to update its status (Assigned → In Progress → Resolved → Closed). When marking "Resolved" or "Closed", upload clean-up proof photos and resolution notes for the citizen Before & After slider.
- AGENCY ANALYTICS: Open "Analytics" to monitor response speed, resolution rate, total assigned vs resolved incidents, and monthly trends.
- OFFICIAL PDF GENERATION: Export compliance-ready PDF incident reports directly from the report detail header.
- DISCUSSION BOARD: Communicate directly with reporting citizens by posting official updates in the report discussion board.
- ORGANIZATION SETTINGS: Update agency profile, contact info, and response categories in "Agency Settings".
`;

const ADMIN_SYSTEM_PROMPT = `
You are GreenAlert Admin Intelligence (AI Command Assistant), a specialized AI command unit built strictly for platform administrators.

${DOMAIN_BOUNDARY_INSTRUCTIONS}
${FORMATTING_RULES}

=== ADMIN OVERSIGHT & COMMAND CAPABILITIES ===
- GLOBAL PLATFORM OVERVIEW: Access real-time sentinel stats, total user counts, active agencies, and incident heatmaps on the Admin Dashboard.
- VERIFYING ORGANIZATIONS: Go to "Organizations" to inspect pending agency registrations, verify credentials, and approve responder permissions.
- USER MANAGEMENT: Search directory, update user roles (Citizen, Agency, Admin), or deactivate non-compliant accounts.
- GLOBAL REPORT AUDITING & RE-ASSIGNMENT: Oversee all reports system-wide, re-assign incidents to specific agencies, override statuses, or delete invalid reports.
- AI TRIAGE AUDITS: Review automated Gemini AI severity classifications (Critical/High/Medium/Low), AI report summaries, and duplicate detection alerts.
- SYSTEM CONTROLS & ANNOUNCEMENTS: Enable system Maintenance Mode, broadcast global announcement banners, and configure notification preferences in "Admin Settings".
`;

/**
 * Greetings & GreenAlert Keywords
 */
const GREETING_WORDS = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'howdy', 'sup', 'yo'];

const GREENALERT_KEYWORDS = [
  'report', 'track', 'status', 'submit', 'create', 'agency', 'admin', 'login', 'signup',
  'map', 'satellite', 'esri', 'google', 'point', 'xp', 'reward', 'badge', 'tier', 'sprout',
  'guardian', 'champion', 'sentinel', 'legend', 'setting', 'notification', 'community',
  'pdf', 'export', 'slider', 'proof', 'before', 'after', 'greenalert', 'account', 'password',
  'email', 'announcement', 'category', 'drainage', 'dumping', 'pollution', 'deforestation',
  'noise', 'analytics', 'verify', 'organization', 'maintenance', 'triage', 'profile',
  'leaderboard', 'saved', 'forum', 'poll', 'discussion', 'dashboard', 'website', 'platform',
  'app', 'site', 'how to', 'where', 'help', 'use', 'feature', 'page', 'what', 'can', 'do'
];

const isGreeting = (query) => {
  const clean = query.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  const words = clean.split(/\s+/);
  return GREETING_WORDS.some((g) => words.includes(g) || clean === g);
};

const isGreenAlertQuery = (query) => {
  const q = query.toLowerCase();
  return GREENALERT_KEYWORDS.some((kw) => q.includes(kw)) || isGreeting(query);
};

/**
 * Intelligent fallback engine for GreenAlert queries if Gemini API is unreachable or rate-limited
 */
const generateFallbackResponse = (query, role) => {
  const q = query.toLowerCase();

  // Handle greetings warmly
  if (isGreeting(query)) {
    return "Hello! 👋 Welcome to **GreenAlert**.\n\nI am your dedicated **GreenAlert AI Assistant**. How can I help you with the website today?\n\nYou can ask me questions such as:\n- 📝 **Submitting & Tracking Reports**: *'How do I submit a report?'*\n- 🛰️ **Satellite Map Controls**: *'How do I switch satellite map feeds?'*\n- 🏆 **Eco Tier XP & Rewards Store**: *'How do Eco Tiers and XP work?'*\n- 📄 **Official PDF Export**: *'How do I download a PDF report?'*\n- 🏢 **Agency & Admin Controls**: Ask about workflow updates or settings";
  }

  // Strict domain boundary check for non-greetings
  if (!isGreenAlertQuery(q)) {
    return "I am the dedicated **GreenAlert AI Assistant**. I can only answer questions related to the **GreenAlert website and platform** (such as submitting reports, tracking incidents, Eco Tier rewards, satellite map feeds, agency workflows, admin controls, and settings). Please ask me a question about GreenAlert!";
  }

  if (role === 'admin') {
    if (q.includes('agency') || q.includes('org') || q.includes('verify') || q.includes('approve')) {
      return "⚡ **Admin Guide — Verifying Agency Organizations:**\n\n1. **Navigate to Organizations**: Select **Organizations** in the Admin sidebar.\n2. **Review Credentials**: Inspect pending agency registrations, uploaded documents, and coverage categories.\n3. **Authorize Access**: Click **Verify** to activate responder privileges.";
    }
    if (q.includes('ai') || q.includes('triage') || q.includes('analysis') || q.includes('gemini')) {
      return "⚡ **Admin Guide — AI Triage & Report Auditing:**\n\n- **Automated Severity**: Gemini AI evaluates reports and flags severity levels (**Low**, **Medium**, **High**, **Critical**).\n- **Duplicate Detection**: Scans for similar nearby reports to prevent redundant dispatch.\n- **Auditing**: Open any report in the Admin Dashboard to review or override AI classifications.";
    }
    if (q.includes('maintenance') || q.includes('mode') || q.includes('system') || q.includes('setting') || q.includes('announcement')) {
      return "⚡ **Admin Guide — System Settings & Controls:**\n\n- **Maintenance Mode**: Toggle system-wide access from **Admin Settings**.\n- **Global Announcement Banner**: Configure site-wide banners for citizen, agency, and admin dashboards.\n- **API Controls**: Monitor rate limits and server status.";
    }
    if (q.includes('user') || q.includes('role') || q.includes('permission')) {
      return "⚡ **Admin Guide — User & Access Management:**\n\n- **User Registry**: Search and filter users by role (**Citizen**, **Agency**, **Admin**).\n- **Role Modification**: Update access permissions or deactivate accounts from the **Users** directory.";
    }
    return "⚡ **Admin Intelligence Command:**\n\nI provide high-level platform administrative guidance:\n- **Agency Approvals**: Verify and activate responding organizations\n- **User Role Management**: Modify user permissions and directory records\n- **AI Triage Audits**: Monitor automated severity classification & duplicate scans\n- **System Maintenance**: Toggle maintenance mode & issue global announcement banners";
  }

  if (role === 'agency') {
    if (q.includes('status') || q.includes('update') || q.includes('progress') || q.includes('resolve') || q.includes('proof')) {
      return "🏢 **Agency Operational Guide — Updating Report Status & Resolution Proof:**\n\n1. **Access Assigned List**: Open **Agency Reports** in your sidebar.\n2. **Select Incident**: Click on the relevant report.\n3. **Update Status**: Select the active stage (**Assigned** → **In Progress** → **Resolved** → **Closed**).\n4. **Upload Resolution Proof**: When marking *Resolved*, upload clean-up photos and resolution notes for the interactive Before & After slider.\n5. **Citizen Alert**: The reporting citizen will receive an instant status update.";
    }
    if (q.includes('assigned') || q.includes('see') || q.includes('find') || q.includes('report')) {
      return "🏢 **Agency Operational Guide — Assigned Incidents:**\n\n- **Filtered View**: Open **Agency Reports** to view incidents assigned to your organization.\n- **Priority Sorting**: Filter reports by priority level (**Critical**, **High**, **Medium**, **Low**) to triage urgent responses first.";
    }
    if (q.includes('analytic') || q.includes('metric') || q.includes('performance') || q.includes('stat')) {
      return "🏢 **Agency Operational Guide — Response Analytics:**\n\n- **Key Metrics**: Track total assigned incidents, completion rate, and pending reviews.\n- **Performance Dashboard**: Open **Analytics** from the sidebar to review response time trends.";
    }
    return "🏢 **Agency Dispatch Assistant:**\n\nI can assist your department with operational workflows:\n- **Status Management**: Guide step-by-step report resolution updates and photo proof uploads\n- **Assigned Incident Filtering**: Navigate department-specific reports\n- **Response Analytics**: Review performance metrics and completion stats";
  }

  // Citizen default fallbacks
  if (q.includes('submit') || q.includes('create') || q.includes('file') || q.includes('new report')) {
    return "🌱 **Step-by-Step Guide — Submitting an Incident Report:**\n\n1. **Open Form**: Click **Create Report** in your navigation sidebar.\n2. **Incident Details**: Provide a clear title and description of the environmental issue.\n3. **Select Category**: Choose the closest category (e.g. *Blocked Drainage*, *Illegal Dumping*).\n4. **Set Geolocation**: Pin the exact location on the satellite map.\n5. **Attach Evidence**: Upload photos or video evidence.\n6. **Submit**: Click **Submit Report** to notify municipal responders!";
  }
  if (q.includes('track') || q.includes('status') || q.includes('check') || q.includes('my report')) {
    return "🌱 **Tracking Your Incident Reports:**\n\n- **Live Workflow**: Go to **My Reports** in your sidebar.\n- **Status Stages**: Follow your report through **Submitted** → **Under Review** → **Assigned** → **In Progress** → **Resolved** → **Closed**.\n- **Before & After Proof**: View agency clean-up verification photos on the interactive slider.\n- **Real-Time Alerts**: Receive push & in-app updates whenever an agency modifies your report.";
  }
  if (q.includes('reward') || q.includes('point') || q.includes('xp') || q.includes('badge') || q.includes('tier') || q.includes('store')) {
    return "🌱 **Eco Tier XP Rewards & Store:**\n\n- **Earn XP**: Receive +25 XP for submitting reports and +50 XP when reports are resolved.\n- **5 Eco Tiers**: Progress through **Sprout** (0–99 XP), **Guardian** (100–249 XP), **Champion** (250–499 XP), **Sentinel** (500–999 XP), and **Legend** (1000+ XP).\n- **Rewards Store**: Open **Achievements** tab to redeem XP for profile frames, pioneer badges, and 2× XP boosts.";
  }
  if (q.includes('map') || q.includes('satellite') || q.includes('esri') || q.includes('google')) {
    return "🌱 **Satellite Map Controls:**\n\n- **Map Portal**: Open **Map** to view all environmental incidents in your area.\n- **Satellite Layer Switcher**: Use the **Satellite Feeds** button to toggle between **Esri Satellite** (HD Aerial), **Google Pure Satellite**, and **Google Hybrid (With Labels)** up to zoom level 21.";
  }
  if (q.includes('pdf') || q.includes('download') || q.includes('export')) {
    return "🌱 **Official PDF Incident Reports:**\n\n- **Generate PDF**: Open any report details page and click **Download Official PDF** in the header.\n- **Official Audit Document**: Produces a clean municipal document with complete metadata, location details, timeline, and Before & After resolution photos.";
  }

  return "👋 **Welcome to GreenAlert Assistant!**\n\nI can answer any question about the **GreenAlert website and platform**:\n- **Submitting & Tracking Reports**: Ask *'How do I submit a report?'*\n- **Satellite Map**: Ask *'How do I use the satellite map feeds?'*\n- **Eco Tier XP & Rewards Store**: Ask *'How do Eco Tiers and XP rewards work?'*\n- **Official PDF Export**: Ask *'How do I download a PDF report?'*\n- **Agency & Admin Controls**: Ask about operational workflows or admin settings";
};

/**
 * POST /api/chat
 * Handles chat requests with role-based specialized prompts and strict domain boundary
 */
const handleChat = async (req, res) => {
  try {
    const { messages } = req.body;
    const userRole = req.user?.role || 'citizen';

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required.' });
    }

    const lastMessage = messages[messages.length - 1]?.content || '';

    let systemPrompt = CITIZEN_SYSTEM_PROMPT;
    if (userRole === 'agency') {
      systemPrompt = AGENCY_SYSTEM_PROMPT;
    } else if (userRole === 'admin') {
      systemPrompt = ADMIN_SYSTEM_PROMPT;
    }

    // Build conversational transcript
    const conversationHistory = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = `${systemPrompt}\n\nConversation so far:\n${conversationHistory}\n\nAssistant:`;

    try {
      const reply = await generateText(prompt);
      if (reply && reply.trim()) {
        return res.json({ reply: reply.trim() });
      }
    } catch (aiErr) {
      logger.warn('Gemini API call failed, deploying local knowledge fallback engine:', aiErr.message);
    }

    // Fallback response if Gemini AI API call failed or is offline
    const fallbackReply = generateFallbackResponse(lastMessage, userRole);
    return res.json({ reply: fallbackReply });
  } catch (err) {
    logger.error('Chat controller unexpected error:', err.message);
    return res.status(500).json({ error: 'Failed to process chat request.' });
  }
};

module.exports = { handleChat };
