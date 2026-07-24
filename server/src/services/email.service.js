const { getBrevoClient } = require('../config/brevo');
const logger = require('../utils/logger');

const LOGO_URL = `${process.env.SERVER_URL || 'http://localhost:5000'}/logo.png`;

/**
 * Sends a generic transactional email using Brevo REST API SDK
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} [options.htmlContent] - Email HTML body
 * @param {string} [options.textContent] - Email plaintext body
 * @returns {Promise<Object>} Brevo response payload
 */
const sendEmail = async ({ to, subject, htmlContent, textContent }) => {
  const client = getBrevoClient();
  if (!client) {
    throw new Error('Brevo REST API client is not configured.');
  }

  const payload = {
    subject,
    htmlContent: htmlContent || '<p></p>',
    sender: {
      name: process.env.BREVO_SENDER_NAME || 'GreenAlert',
      email: process.env.BREVO_SENDER_EMAIL
    },
    to: [{ email: to }]
  };

  if (textContent) {
    payload.textContent = textContent;
  }

  try {
    const response = await client.transactionalEmails.sendTransacEmail(payload);
    return response;
  } catch (error) {
    logger.error('Brevo sendEmail failed:', error.message || error);
    throw error;
  }
};

/**
 * Sends a welcoming email to a new user
 * @param {string} to - Recipient email address
 * @param {string} name - User's name
 * @returns {Promise<Object>}
 */
const sendWelcomeEmail = async (to, name) => {
  const subject = `Welcome to ${process.env.APP_NAME || 'GreenAlert'}!`;
  const htmlContent = `
    <div style="font-family: 'Outfit', sans-serif; padding: 30px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
      <div style="text-align: center; margin-bottom: 25px;">
        <img src="${LOGO_URL}" alt="GreenAlert" style="height: 60px; width: auto;" />
        <h2 style="color: #059669; margin: 15px 0 0 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Welcome to GreenAlert</h2>
        <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0; font-weight: 500;">Your portal for cleaner, safer communities</p>
      </div>
      <h3 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700;">Hello ${name},</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
        Thank you for joining GreenAlert! By signing up, you've taken a powerful step toward preserving and improving the environment in your local area.
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 20px; border-radius: 16px; margin: 25px 0;">
        <h4 style="color: #0f172a; margin: 0 0 10px 0; font-size: 14px; font-weight: 750;">Here is how you can make an impact today:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; color: #475569; line-height: 1.8;">
          <li>📸 <strong>Report issues</strong> — Log pollution, illegal waste dumping, or drainage blocks.</li>
          <li>⚡ <strong>Live Updates</strong> — Track real-time progress as designated agencies work on it.</li>
          <li>🤖 <strong>Gemini AI</strong> — Benefit from automated severity checks and duplicate detection.</li>
          <li>🏆 <strong>XP Achievements</strong> — Earn community points and badges as a verified reporter.</li>
        </ul>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
        Ready to explore? Log in to your citizen dashboard to see reports in your neighborhood or file your first incident log.
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
        This is an automated message from GreenAlert.<br/>
        If you did not create this account, please ignore this email.
      </p>
    </div>
  `;
  return sendEmail({ to, subject, htmlContent });
};

/**
 * Sends a password change 6-digit confirmation code
 * @param {string} to - Recipient email address
 * @param {string} name - User's name
 * @param {string} code - 6-digit verification code
 * @returns {Promise<Object>}
 */
const sendPasswordChangeCodeEmail = async (to, name, code) => {
  const subject = 'Confirm Password Change Request';
  const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${LOGO_URL}" alt="GreenAlert" style="height: 50px; width: auto;" />
        <h2 style="color: #059669; margin: 10px 0 0 0; font-size: 24px;">GreenAlert Security</h2>
      </div>
      <h3 style="color: #0f172a; margin-top: 0;">Hello ${name},</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        We received a request to change your account password. Please use the verification code below to complete this action:
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
        <span style="font-size: 12px; font-weight: bold; color: #64748b; uppercase tracking-wider block; margin-bottom: 8px;">Verification Code</span>
        <span style="font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 6px; display: inline-block;">
          ${code}
        </span>
      </div>
      <p style="font-size: 13px; line-height: 1.6; color: #64748b;">
        This code is valid for 10 minutes. If you did not initiate this request, please contact support and change your login credentials immediately.
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        Best regards,<br/>
        <strong>The GreenAlert Team</strong>
      </p>
    </div>
  `;
  return sendEmail({ to, subject, htmlContent });
};

/**
 * Sends a password reset verification link email
 * @param {string} to - Recipient email address
 * @param {string} resetLink - Password reset link URL
 * @returns {Promise<Object>}
 */
const sendPasswordResetEmail = async (to, resetLink) => {
  const subject = 'Reset Your Password';
  const htmlContent = `
    <h1>Password Reset Request</h1>
    <p>You requested to reset your password. Click the link below to set a new password:</p>
    <p><a href="${resetLink}" target="_blank">Reset Password</a></p>
    <p>If you did not request this, please ignore this email.</p>
    <p>Best regards,<br/>The GreenAlert Team</p>
  `;
  return sendEmail({ to, subject, htmlContent });
};

/**
 * Sends a notification email about a report status update
 * @param {string} to - Recipient email address
 * @param {string} name - User's name
 * @param {string} reportTitle - Report title
 * @param {string} reportStatus - New status of the report
 * @param {string} category - Report category
 * @returns {Promise<Object>}
 */
const sendReportStatusEmail = async (to, name, reportTitle, reportStatus, category) => {
  const subject = `Update on your GreenAlert Report: ${reportTitle}`;
  const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${LOGO_URL}" alt="GreenAlert" style="height: 50px; width: auto;" />
        <h2 style="color: #0d9488; margin: 10px 0 0 0; font-size: 24px;">GreenAlert Update</h2>
      </div>
      <h3 style="color: #0f172a; margin-top: 0;">Hello ${name},</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        There is an update on the environmental incident report you submitted: <strong>"${reportTitle}"</strong> (${category}).
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 16px; border-radius: 12px; margin: 20px 0; text-align: center;">
        <span style="font-size: 12px; font-weight: bold; color: #64748b; uppercase tracking-wider block; margin-bottom: 6px;">New Status</span>
        <span style="background-color: #ccfbf1; color: #0f766e; padding: 6px 16px; border-radius: 9999px; font-size: 14px; font-weight: bold; display: inline-block;">
          ${reportStatus}
        </span>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        You can track the live progress, read official notes, and communicate with responders via your citizen dashboard.
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 30px; border-t: 1px solid #f1f5f9; padding-top: 15px;">
        Best regards,<br/>
        <strong>The GreenAlert Team</strong>
      </p>
    </div>
  `;
  return sendEmail({ to, subject, htmlContent });
};

/**
 * Sends a notification email when an organization is verified by admin
 * @param {string} to - Organization contact email
 * @param {string} orgName - Organization name
 * @returns {Promise<Object>}
 */
const sendOrgVerifiedEmail = async (to, orgName) => {
  const subject = `Your Organization "${orgName}" Has Been Verified`;
  const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${LOGO_URL}" alt="GreenAlert" style="height: 50px; width: auto;" />
        <h2 style="color: #059669; margin: 10px 0 0 0; font-size: 24px;">GreenAlert Verification</h2>
      </div>
      <h3 style="color: #0f172a; margin-top: 0;">Congratulations ${orgName}!</h3>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 12px; margin: 20px 0; text-align: center;">
        <img src="${LOGO_URL}" alt="GreenAlert" style="height: 60px; width: auto;" />
        <p style="font-size: 16px; font-weight: bold; color: #166534; margin: 10px 0 0 0;">Your organization has been verified!</p>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Your organization has been approved by the GreenAlert administrator. You can now log in to the agency portal and start managing environmental reports assigned to your organization.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        You will receive real-time notifications when new reports are assigned to your organization, and can update report statuses as you work on them.
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        Best regards,<br/>
        <strong>The GreenAlert Team</strong>
      </p>
    </div>
  `;
  return sendEmail({ to, subject, htmlContent });
};

/**
 * Sends a report submission confirmation email to the citizen
 * @param {string} to - Citizen email
 * @param {string} name - Citizen name
 * @param {Object} report - Report object { title, category, priority, location, description }
 * @returns {Promise<Object>}
 */
const sendReportSubmittedEmail = async (to, name, report) => {
  const subject = `✅ Report Received: "${report.title}" – GreenAlert`;
  const priorityColor = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Critical: '#dc2626' }[report.priority] || '#64748b';
  const htmlContent = `
    <div style="font-family: 'Outfit', sans-serif; padding: 32px; color: #1e293b; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${LOGO_URL}" alt="GreenAlert" style="height: 56px; width: auto;" />
        <h2 style="color: #059669; margin: 14px 0 0 0; font-size: 24px; font-weight: 800;">Report Submitted Successfully</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Your environmental report is now in our system</p>
      </div>
      <h3 style="color: #0f172a; margin-top: 0; font-size: 17px; font-weight: 700;">Hello ${name},</h3>
      <p style="font-size: 14px; line-height: 1.7; color: #475569;">
        Thank you for reporting an environmental concern. Your report has been received and is now under review by our team. We'll keep you updated as it progresses.
      </p>
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%); border: 1px solid #bbf7d0; border-radius: 16px; padding: 20px; margin: 24px 0;">
        <h4 style="margin: 0 0 14px 0; font-size: 13px; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800;">📋 Report Summary</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 120px;">Title</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${report.title}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Category</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${report.category}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Location</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${report.location}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Priority</td><td style="padding: 6px 0;"><span style="background-color: ${priorityColor}22; color: ${priorityColor}; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;">${report.priority}</span></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Status</td><td style="padding: 6px 0;"><span style="background-color: #dbeafe; color: #1d4ed8; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;">Submitted</span></td></tr>
        </table>
      </div>
      <p style="font-size: 14px; line-height: 1.7; color: #475569;">
        You can track the progress of your report and receive real-time updates on your GreenAlert citizen dashboard.
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 18px; text-align: center;">
        Thank you for helping keep our environment clean. 🌿<br/>
        <strong>The GreenAlert Team</strong>
      </p>
    </div>
  `;
  return sendEmail({ to, subject, htmlContent });
};

/**
 * Sends an alert email to the admin when a new report is submitted
 * @param {string} adminEmail - Admin email
 * @param {Object} report - Report object
 * @param {Object} citizen - Citizen user object { fullName, email }
 * @returns {Promise<Object>}
 */
const sendAdminNewReportAlert = async (adminEmail, report, citizen) => {
  const subject = `🚨 New Report Submitted: "${report.title}" [${report.priority}]`;
  const priorityColor = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Critical: '#dc2626' }[report.priority] || '#64748b';
  const htmlContent = `
    <div style="font-family: 'Outfit', sans-serif; padding: 32px; color: #1e293b; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${LOGO_URL}" alt="GreenAlert" style="height: 56px; width: auto;" />
        <h2 style="color: #dc2626; margin: 14px 0 0 0; font-size: 24px; font-weight: 800;">New Report Alert</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">A new environmental report has been submitted</p>
      </div>
      <div style="background: linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%); border: 1px solid #fecaca; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 14px 0; font-size: 13px; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800;">📋 Report Details</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 130px;">Title</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${report.title}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Category</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${report.category}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Location</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${report.location}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Priority</td><td style="padding: 6px 0;"><span style="background-color: ${priorityColor}22; color: ${priorityColor}; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;">${report.priority}</span></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Description</td><td style="padding: 6px 0; color: #475569; font-style: italic;">${(report.description || '').substring(0, 200)}${report.description && report.description.length > 200 ? '...' : ''}</td></tr>
        </table>
      </div>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700;">👤 Submitted By</h4>
        <p style="margin: 0; font-size: 13.5px; color: #0f172a; font-weight: 600;">${citizen.fullName} &lt;${citizen.email}&gt;</p>
      </div>
      <p style="font-size: 14px; line-height: 1.7; color: #475569;">
        Please log in to the GreenAlert admin panel to review this report, assign it to the appropriate agency, and ensure timely action.
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 18px; text-align: center;">
        This is an automated alert from GreenAlert.<br/>
        <strong>GreenAlert Admin System</strong>
      </p>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject, htmlContent });
};

/**
 * Sends a notification email to an agency when a report is assigned to them
 * @param {string} to - Agency contact email
 * @param {string} agencyName - Agency / organization name
 * @param {Object} report - Report object { title, category, priority, location, description }
 * @param {Object} citizen - Citizen user object { fullName, email }
 * @returns {Promise<Object>}
 */
const sendReportAssignedToAgencyEmail = async (to, agencyName, report, citizen) => {
  const subject = `📌 New Report Assigned to ${agencyName}: "${report.title}"`;
  const priorityColor = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Critical: '#dc2626' }[report.priority] || '#64748b';
  const htmlContent = `
    <div style="font-family: 'Outfit', sans-serif; padding: 32px; color: #1e293b; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${LOGO_URL}" alt="GreenAlert" style="height: 56px; width: auto;" />
        <h2 style="color: #0d9488; margin: 14px 0 0 0; font-size: 24px; font-weight: 800;">New Report Assigned</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Action required from your agency</p>
      </div>
      <h3 style="color: #0f172a; margin-top: 0; font-size: 17px; font-weight: 700;">Hello ${agencyName},</h3>
      <p style="font-size: 14px; line-height: 1.7; color: #475569;">
        A new environmental report has been assigned to your organization by the GreenAlert admin. Please review the details below and take prompt action.
      </p>
      <div style="background: linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%); border: 1px solid #99f6e4; border-radius: 16px; padding: 20px; margin: 24px 0;">
        <h4 style="margin: 0 0 14px 0; font-size: 13px; color: #0d9488; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800;">📋 Report Details</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 120px;">Title</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${report.title}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Category</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${report.category}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Location</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${report.location}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Priority</td><td style="padding: 6px 0;"><span style="background-color: ${priorityColor}22; color: ${priorityColor}; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;">${report.priority}</span></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Description</td><td style="padding: 6px 0; color: #475569; font-style: italic;">${(report.description || '').substring(0, 200)}${report.description && report.description.length > 200 ? '...' : ''}</td></tr>
        </table>
      </div>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700;">👤 Reported By</h4>
        <p style="margin: 0; font-size: 13.5px; color: #0f172a; font-weight: 600;">${citizen.fullName} &lt;${citizen.email}&gt;</p>
      </div>
      <p style="font-size: 14px; line-height: 1.7; color: #475569;">
        Log in to the GreenAlert agency portal to update the report status as you work through it. The citizen will be automatically notified of each update.
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 18px; text-align: center;">
        This is an automated message from GreenAlert.<br/>
        <strong>The GreenAlert Team</strong>
      </p>
    </div>
  `;
  return sendEmail({ to, subject, htmlContent });
};

/**
 * Sends a status update alert email to the admin when an agency changes a report's status
 * @param {string} adminEmail - Admin email
 * @param {Object} report - Report object { title, category, priority, location }
 * @param {string} newStatus - The new status
 * @param {string} agencyName - Name of the agency who updated it
 * @param {Object} citizen - Citizen { fullName, email }
 * @returns {Promise<Object>}
 */
const sendAdminStatusUpdateAlert = async (adminEmail, report, newStatus, agencyName, citizen) => {
  const subject = `📊 Report Status Updated: "${report.title}" → ${newStatus}`;
  const statusColor = {
    'Submitted': '#3b82f6', 'Under Review': '#8b5cf6', 'Assigned': '#f59e0b',
    'In Progress': '#0d9488', 'Resolved': '#22c55e', 'Closed': '#64748b'
  }[newStatus] || '#64748b';
  const htmlContent = `
    <div style="font-family: 'Outfit', sans-serif; padding: 32px; color: #1e293b; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${LOGO_URL}" alt="GreenAlert" style="height: 56px; width: auto;" />
        <h2 style="color: #7c3aed; margin: 14px 0 0 0; font-size: 24px; font-weight: 800;">Report Status Updated</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">An agency has updated a report's status</p>
      </div>
      <div style="background: linear-gradient(135deg, #faf5ff 0%, #f8fafc 100%); border: 1px solid #ddd6fe; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 14px 0; font-size: 13px; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800;">📋 Report Details</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 140px;">Report Title</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${report.title}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Category</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${report.category}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Location</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${report.location}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Updated By</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${agencyName}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">New Status</td><td style="padding: 6px 0;"><span style="background-color: ${statusColor}22; color: ${statusColor}; padding: 2px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700;">${newStatus}</span></td></tr>
        </table>
      </div>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700;">👤 Reported By</h4>
        <p style="margin: 0; font-size: 13.5px; color: #0f172a; font-weight: 600;">${citizen.fullName} &lt;${citizen.email}&gt;</p>
      </div>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 18px; text-align: center;">
        This is an automated notification from GreenAlert.<br/>
        <strong>GreenAlert Admin System</strong>
      </p>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject, htmlContent });
};

/**
 * Sends a notification email to the citizen when their report is assigned to an agency
 * @param {string} to - Citizen email
 * @param {string} name - Citizen name
 * @param {Object} report - Report object { title, category, location }
 * @param {string} agencyName - Name of the agency assigned
 * @returns {Promise<Object>}
 */
const sendReportAssignedToCitizenEmail = async (to, name, report, agencyName) => {
  const subject = `🏢 Your Report Has Been Assigned – GreenAlert`;
  const htmlContent = `
    <div style="font-family: 'Outfit', sans-serif; padding: 32px; color: #1e293b; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${LOGO_URL}" alt="GreenAlert" style="height: 56px; width: auto;" />
        <h2 style="color: #f59e0b; margin: 14px 0 0 0; font-size: 24px; font-weight: 800;">Report Assigned to Agency</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Your report is being handled by a specialist team</p>
      </div>
      <h3 style="color: #0f172a; margin-top: 0; font-size: 17px; font-weight: 700;">Hello ${name},</h3>
      <p style="font-size: 14px; line-height: 1.7; color: #475569;">
        Great news! Your environmental report <strong>"${report.title}"</strong> has been reviewed and assigned to a specialist agency for action.
      </p>
      <div style="background: linear-gradient(135deg, #fffbeb 0%, #f8fafc 100%); border: 1px solid #fde68a; border-radius: 16px; padding: 20px; margin: 24px 0;">
        <h4 style="margin: 0 0 14px 0; font-size: 13px; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800;">📋 Assignment Info</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 130px;">Report</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${report.title}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Category</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${report.category}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Location</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${report.location}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Assigned To</td><td style="padding: 6px 0; font-weight: 700; color: #d97706;">${agencyName}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Status</td><td style="padding: 6px 0;"><span style="background-color: #fef9c3; color: #b45309; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;">Assigned</span></td></tr>
        </table>
      </div>
      <p style="font-size: 14px; line-height: 1.7; color: #475569;">
        You'll continue to receive email updates as the agency works through your report. You can also track progress in real-time on your GreenAlert dashboard.
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 18px; text-align: center;">
        Thank you for making a difference. 🌿<br/>
        <strong>The GreenAlert Team</strong>
      </p>
    </div>
  `;
  return sendEmail({ to, subject, htmlContent });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendReportStatusEmail,
  sendPasswordChangeCodeEmail,
  sendOrgVerifiedEmail,
  sendReportSubmittedEmail,
  sendAdminNewReportAlert,
  sendReportAssignedToAgencyEmail,
  sendAdminStatusUpdateAlert,
  sendReportAssignedToCitizenEmail
};
