const nodemailer = require("nodemailer");
const logger     = require("../utils/logger");

// ── Transporter (lazy singleton) ──────────────────────────
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  if (process.env.EMAIL_SERVICE || process.env.EMAIL_HOST) {
    const isGmail = (process.env.EMAIL_HOST && process.env.EMAIL_HOST.includes("gmail")) || process.env.EMAIL_SERVICE === "gmail";
    const transportConfig = isGmail
      ? {
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        }
      : {
          host:   process.env.EMAIL_HOST,
          port:   parseInt(process.env.EMAIL_PORT, 10) || 587,
          secure: process.env.EMAIL_SECURE === "true", // true for port 465
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === "production",
          },
        };

    _transporter = nodemailer.createTransport(transportConfig);
  }

  return _transporter;
};

const FROM_ADDRESS = () =>
  `"${process.env.EMAIL_FROM_NAME || "Skillora"}" <${process.env.EMAIL_FROM || "noreply@skillora.app"}>`;

// ── Core send ─────────────────────────────────────────────
/**
 * Send an email. Gracefully no-ops if SMTP is not configured.
 * In development without SMTP, logs a preview URL via Ethereal.
 */
const send = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();

  if (!transporter) {
    // Dev fallback — create a one-time Ethereal test account and log preview URL
    if (process.env.NODE_ENV !== "production") {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const devTransport = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        const info = await devTransport.sendMail({
          from: FROM_ADDRESS(), to, subject, html, text: text || subject,
        });
        logger.info(`[Dev email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      } catch (err) {
        logger.warn(`Dev email preview failed: ${err.message}`);
      }
    } else {
      logger.warn(`[Email skipped — no SMTP config] To: ${to} | Subject: ${subject}`);
    }
    return;
  }

  try {
    const info = await transporter.sendMail({
      from:    FROM_ADDRESS(),
      to,
      subject,
      html,
      text:    text || subject,
    });
    logger.info(`Email sent to ${to}: ${subject} (messageId: ${info.messageId})`);
  } catch (err) {
    logger.error(`Email failed to ${to}: ${err.message}`);
  }
};

// ── Reusable Executive HTML Email Wrapper (Skillora White Canvas + Floating Dark Card) ─
const renderEmailWrapper = ({ title, preheader, bodyHtml }) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;font-family:'Sora','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;width:100% !important;">
  
  ${preheader ? `
  <div style="display:none;font-size:1px;color:#FFFFFF;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>` : ""}

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FFFFFF;padding:48px 16px;">
    <tr>
      <td align="center">
        <!-- Floating Dark Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#0B0F1A;border:1px solid #1E293B;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.12);">
          
          <!-- Header with Exact Skillora Logo & Purple Glow matching second image -->
          <tr>
            <td style="padding:32px 36px 24px 36px;border-bottom:1px solid #1E293B;background:radial-gradient(ellipse 70% 90% at 20% 50%, rgba(124,111,255,0.18) 0%, transparent 80%);">
              <a href="${clientUrl}" style="text-decoration:none;display:inline-block;">
                <span style="font-family:'Sora','Inter',sans-serif;font-size:26px;font-weight:800;letter-spacing:-0.04em;color:#FFFFFF;line-height:1;display:block;text-shadow:0 0 16px rgba(124,111,255,0.7);">
                  Skillora
                </span>
              </a>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding:36px;color:#CBD5E1;font-size:15px;line-height:1.7;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Upgraded Pure Clean Dark Footer -->
          <tr>
            <td style="padding:24px 36px;background-color:#070A12;border-top:1px solid #1E293B;text-align:center;color:#64748B;font-size:12px;line-height:1.5;">
              <p style="margin:0 0 4px 0;font-weight:700;color:#CBD5E1;font-size:13px;">
                Skillora
              </p>
              <p style="margin:0;font-size:11px;color:#64748B;">
                © 2025 Skillora. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// ── Reusable CTA Button Helper ──────────────────────────────
const renderCtaButton = (text, url) => `
<div style="text-align:center;margin:32px 0 24px 0;">
  <!--[if mso]>
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="18%" stroke="f" fillcolor="#5B52F0">
    <w:anchorlock/>
    <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:bold;">${text}</center>
  </v:roundrect>
  <![endif]-->
  <!--[if !mso]><!-->
  <a href="${url}"
     style="display:inline-block;padding:12px 30px;background:linear-gradient(135deg, #7C6FFF 0%, #5B52F0 100%);color:#FFFFFF;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(91,82,240,0.4);border:1px solid rgba(255,255,255,0.15);">
    ${text}
  </a>
  <!--<![endif]-->
</div>
`;

// ── Templates ─────────────────────────────────────────────

const sendWelcome = (user) => {
  const firstName = user.name ? user.name.split(" ")[0] : "User";
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return send({
    to:      user.email,
    subject: `Welcome to Skillora — Your account is ready 🚀`,
    html: renderEmailWrapper({
      title: "Welcome to Skillora",
      preheader: "Start managing clients, projects, invoices, and AI workspace automation",
      bodyHtml: `
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:800;margin:0 0 16px 0;letter-spacing:-0.03em;line-height:1.3;">
          Welcome to Skillora 🚀
        </h1>

        <p style="color:#E2E8F0;margin:0 0 24px 0;font-size:15px;line-height:1.7;">
          Hi <strong style="color:#FFFFFF;">${firstName}</strong>,<br/>
          Welcome to Skillora! Your workspace is ready. Manage projects, collaborate with clients, create automated Razorpay invoices, and generate AI proposals all in one place.
        </p>

        <!-- Account Details Grid -->
        <div style="background:linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px 24px;margin:24px 0;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;padding-bottom:10px;">Registered Email</td>
              <td align="right" style="padding-bottom:10px;">
                <span style="color:#C4B5FD;font-size:13px;font-weight:700;">${user.email}</span>
              </td>
            </tr>
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;">Account Plan</td>
              <td align="right" style="color:#34D399;font-size:13px;font-weight:700;">✓ Active Workspace</td>
            </tr>
          </table>
        </div>

        ${renderCtaButton("Go to Dashboard →", `${clientUrl}/dashboard`)}
      `,
    }),
  });
};

const sendPasswordReset = (user, resetUrl) => {
  const firstName = user.name ? user.name.split(" ")[0] : "there";
  return send({
    to:      user.email,
    subject: "Action Required: Reset your Skillora password",
    html: renderEmailWrapper({
      title: "Reset Password Request",
      preheader: "Security request to reset your Skillora account password",
      bodyHtml: `
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:800;margin:0 0 16px 0;letter-spacing:-0.03em;line-height:1.3;">
          Reset Your Password
        </h1>

        <p style="color:#E2E8F0;margin:0 0 24px 0;font-size:15px;line-height:1.7;">
          Hi <strong style="color:#FFFFFF;">${firstName}</strong>,<br/>
          We received a request to reset the password for your Skillora account. Click the button below to set a new password.
        </p>

        <!-- Structured Info Grid -->
        <div style="background:linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px 24px;margin:24px 0;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;padding-bottom:10px;">Account Email</td>
              <td align="right" style="padding-bottom:10px;">
                <span style="color:#C4B5FD;font-size:13px;font-weight:700;">${user.email}</span>
              </td>
            </tr>
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;padding-bottom:10px;">Link Expiry</td>
              <td align="right" style="color:#FF6B6B;font-size:13px;font-weight:700;padding-bottom:10px;">⚡ 10 Minutes</td>
            </tr>
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;">Security Notice</td>
              <td align="right" style="color:#34D399;font-size:13px;font-weight:700;">✓ Single-Use Link</td>
            </tr>
          </table>
        </div>

        ${renderCtaButton("Reset Password →", resetUrl)}

        <p style="color:#64748B;font-size:13px;margin:24px 0 0 0;line-height:1.6;text-align:center;">
          If you did not request a password reset, you can safely ignore this email.<br/>
          Your password will remain safe and unchanged.
        </p>
      `,
    }),
  });
};

const sendInvoice = (user, invoice, clientEmail) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const formattedDueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-US", { dateStyle: "medium" }) : "Due on receipt";

  return send({
    to:      clientEmail,
    subject: `Invoice #${invoice.invoiceNumber} from ${user.name || "Freelancer"} (${invoice.currency} ${(invoice.total || 0).toFixed(2)})`,
    html: renderEmailWrapper({
      title: `Invoice #${invoice.invoiceNumber}`,
      preheader: `Invoice #${invoice.invoiceNumber} for ${invoice.currency} ${(invoice.total || 0).toFixed(2)} is now available`,
      bodyHtml: `
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:800;margin:0 0 16px 0;letter-spacing:-0.03em;line-height:1.3;">
          Invoice #${invoice.invoiceNumber}
        </h1>

        <p style="color:#E2E8F0;margin:0 0 24px 0;font-size:15px;line-height:1.7;">
          Hello,<br/>
          You have received a new invoice from <strong style="color:#FFFFFF;">${user.name || "Freelancer"}</strong>. Review the details below and complete payment online.
        </p>

        <!-- Invoice Details Box -->
        <div style="background:linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:22px 24px;margin:24px 0;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;padding-bottom:10px;">Invoice Number</td>
              <td align="right" style="color:#FFFFFF;font-size:14px;font-weight:700;padding-bottom:10px;">#${invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;padding-bottom:10px;">Billed By</td>
              <td align="right" style="color:#FFFFFF;font-size:14px;font-weight:700;padding-bottom:10px;">${user.name || "Freelancer"}</td>
            </tr>
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;padding-bottom:10px;">Due Date</td>
              <td align="right" style="color:#FFFFFF;font-size:14px;font-weight:700;padding-bottom:10px;">${formattedDueDate}</td>
            </tr>
            <tr>
              <td style="color:#94A3B8;font-size:14px;font-weight:700;padding-top:10px;border-top:1px solid rgba(255,255,255,0.1);">Total Amount Due</td>
              <td align="right" style="color:#C4B5FD;font-size:22px;font-weight:900;padding-top:10px;border-top:1px solid rgba(255,255,255,0.1);">${invoice.currency} ${(invoice.total || 0).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        ${invoice.notes ? `<p style="color:#94A3B8;font-size:13px;margin:0 0 20px 0;line-height:1.6;"><strong style="color:#FFFFFF;">Notes:</strong> ${invoice.notes}</p>` : ""}

        ${renderCtaButton("View & Pay Invoice →", `${clientUrl}/client/dashboard`)}
      `,
    }),
  });
};

const sendSubscriptionConfirm = (user, plan) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const firstName = user.name ? user.name.split(" ")[0] : "there";
  return send({
    to:      user.email,
    subject: `Subscription Confirmed — Welcome to Skillora ${plan.toUpperCase()}`,
    html: renderEmailWrapper({
      title: "Subscription Activated",
      preheader: `Your ${plan.toUpperCase()} plan features are now active on your account`,
      bodyHtml: `
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:800;margin:0 0 16px 0;letter-spacing:-0.03em;line-height:1.3;">
          Subscription Active 🎉
        </h1>

        <p style="color:#E2E8F0;margin:0 0 24px 0;font-size:15px;line-height:1.7;">
          Hi <strong style="color:#FFFFFF;">${firstName}</strong>,<br/>
          Your subscription to <strong style="color:#C4B5FD;">Skillora ${plan.toUpperCase()}</strong> is now active. Enjoy full access to all workspace features, AI tools, and priority support.
        </p>

        <div style="background:linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px 24px;margin:24px 0;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;padding-bottom:10px;">Subscription Plan</td>
              <td align="right" style="color:#C4B5FD;font-size:14px;font-weight:800;padding-bottom:10px;">${plan.toUpperCase()} PLAN</td>
            </tr>
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;">Plan Status</td>
              <td align="right" style="color:#34D399;font-size:13px;font-weight:700;">✓ Active & Verified</td>
            </tr>
          </table>
        </div>

        ${renderCtaButton("Manage Subscription →", `${clientUrl}/settings?tab=billing`)}
      `,
    }),
  });
};

const sendClientInvite = (client, inviteToken) => {
  const inviteUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/client/accept-invite?token=${inviteToken}`;
  const firstName = client.name ? client.name.split(" ")[0] : "there";
  return send({
    to:      client.email,
    subject: `Invitation: Access your Client Portal on Skillora`,
    html: renderEmailWrapper({
      title: "Client Portal Invitation",
      preheader: "Access project milestones, review work, and pay invoices",
      bodyHtml: `
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:800;margin:0 0 16px 0;letter-spacing:-0.03em;line-height:1.3;">
          Client Portal Invitation
        </h1>

        <p style="color:#E2E8F0;margin:0 0 24px 0;font-size:15px;line-height:1.7;">
          Hi <strong style="color:#FFFFFF;">${firstName}</strong>,<br/>
          You have been invited to join your dedicated Client Portal on Skillora. Track project milestones, review work, and pay invoices securely online.
        </p>

        <div style="background:linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px 24px;margin:24px 0;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;padding-bottom:10px;">Portal Status</td>
              <td align="right" style="color:#34D399;font-size:13px;font-weight:700;padding-bottom:10px;">✓ Invitation Ready</td>
            </tr>
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;">Link Expiry</td>
              <td align="right" style="color:#FF6B6B;font-size:13px;font-weight:700;">⚡ Valid for 48 Hours</td>
            </tr>
          </table>
        </div>

        ${renderCtaButton("Accept Portal Invitation →", inviteUrl)}
      `,
    }),
  });
};

const sendPaymentReceipt = (user, payment) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const firstName = user?.name ? user.name.split(" ")[0] : "Valued Client";
  const formattedDate = payment?.paidAt ? new Date(payment.paidAt).toLocaleDateString("en-US", { dateStyle: "medium" }) : new Date().toLocaleDateString("en-US", { dateStyle: "medium" });

  return send({
    to:      user?.email || payment?.clientEmail,
    subject: `Payment Receipt — ${payment.currency || "USD"} ${(payment.amount || 0).toFixed(2)} Confirmed`,
    html: renderEmailWrapper({
      title: "Payment Receipt Confirmed",
      preheader: `Payment receipt of ${payment.currency || "USD"} ${(payment.amount || 0).toFixed(2)} processed successfully`,
      bodyHtml: `
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:800;margin:0 0 16px 0;letter-spacing:-0.03em;line-height:1.3;">
          Payment Successful 🎉
        </h1>

        <p style="color:#E2E8F0;margin:0 0 24px 0;font-size:15px;line-height:1.7;">
          Hi <strong style="color:#FFFFFF;">${firstName}</strong>,<br/>
          Thank you! We have received your payment. A detailed summary of your transaction is provided below.
        </p>

        <!-- Payment Details Grid -->
        <div style="background:linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px 24px;margin:24px 0;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;padding-bottom:10px;">Transaction ID</td>
              <td align="right" style="color:#C4B5FD;font-size:13px;font-weight:700;padding-bottom:10px;">${payment.transactionId || payment._id || "N/A"}</td>
            </tr>
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;padding-bottom:10px;">Payment Date</td>
              <td align="right" style="color:#FFFFFF;font-size:13px;font-weight:700;padding-bottom:10px;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;padding-bottom:10px;">Payment Method</td>
              <td align="right" style="color:#FFFFFF;font-size:13px;font-weight:700;padding-bottom:10px;">${(payment.paymentMethod || "Razorpay").toUpperCase()}</td>
            </tr>
            <tr>
              <td style="color:#94A3B8;font-size:14px;font-weight:700;padding-top:10px;border-top:1px solid rgba(255,255,255,0.1);">Total Paid</td>
              <td align="right" style="color:#34D399;font-size:22px;font-weight:900;padding-top:10px;border-top:1px solid rgba(255,255,255,0.1);">${payment.currency || "USD"} ${(payment.amount || 0).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        ${renderCtaButton("View Payments & Invoices →", `${clientUrl}/payments`)}
      `,
    }),
  });
};

const sendMeetingReminder = (recipientEmail, recipientName, meeting) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const firstName = recipientName ? recipientName.split(" ")[0] : "there";
  const roomLink = meeting.roomLink || `${clientUrl}/dashboard`;

  return send({
    to:      recipientEmail,
    subject: `⏰ Meeting Starting Soon: ${meeting.title || "Scheduled Meeting"}`,
    html: renderEmailWrapper({
      title: "Meeting Reminder",
      preheader: `Your scheduled meeting "${meeting.title}" is starting in 15 minutes`,
      bodyHtml: `
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:800;margin:0 0 16px 0;letter-spacing:-0.03em;line-height:1.3;">
          Meeting Starting Soon ⏰
        </h1>

        <p style="color:#E2E8F0;margin:0 0 24px 0;font-size:15px;line-height:1.7;">
          Hi <strong style="color:#FFFFFF;">${firstName}</strong>,<br/>
          Your video meeting <strong style="color:#C4B5FD;">"${meeting.title}"</strong> is starting shortly. Click the button below to join the room.
        </p>

        <div style="background:linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px 24px;margin:24px 0;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;padding-bottom:10px;">Meeting Title</td>
              <td align="right" style="color:#FFFFFF;font-size:13px;font-weight:700;padding-bottom:10px;">${meeting.title}</td>
            </tr>
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;">Status</td>
              <td align="right" style="color:#34D399;font-size:13px;font-weight:700;">🟢 Room Ready</td>
            </tr>
          </table>
        </div>

        ${renderCtaButton("Join Video Room Now →", roomLink)}
      `,
    }),
  });
};

const sendProposalNotification = (recipientEmail, recipientName, proposal, project, type = "new_proposal") => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const firstName = recipientName ? recipientName.split(" ")[0] : "there";
  const isApproved = type === "proposal_approved";

  const subject = isApproved
    ? `Proposal Approved 🎉 — "${project?.title || "Project"}"`
    : `New Proposal Received for "${project?.title || "Project"}"`;

  const titleText = isApproved ? "Proposal Approved 🎉" : "New Proposal Received 📄";
  const ctaText   = isApproved ? "Go to Workspace →" : "Review Proposal →";
  const ctaUrl    = isApproved ? `${clientUrl}/dashboard` : `${clientUrl}/client/projects`;

  return send({
    to:      recipientEmail,
    subject,
    html: renderEmailWrapper({
      title: titleText,
      preheader: `Update regarding proposal for "${project?.title || "Project"}"`,
      bodyHtml: `
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:800;margin:0 0 16px 0;letter-spacing:-0.03em;line-height:1.3;">
          ${titleText}
        </h1>

        <p style="color:#E2E8F0;margin:0 0 24px 0;font-size:15px;line-height:1.7;">
          Hi <strong style="color:#FFFFFF;">${firstName}</strong>,<br/>
          ${isApproved 
            ? `Great news! Your proposal for project <strong style="color:#C4B5FD;">"${project?.title}"</strong> has been accepted. You can now start collaborating.`
            : `A new proposal has been submitted for your project <strong style="color:#C4B5FD;">"${project?.title}"</strong>.`}
        </p>

        <div style="background:linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px 24px;margin:24px 0;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;padding-bottom:10px;">Project Title</td>
              <td align="right" style="color:#FFFFFF;font-size:13px;font-weight:700;padding-bottom:10px;">${project?.title || "Project"}</td>
            </tr>
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;padding-bottom:10px;">Bid / Budget Amount</td>
              <td align="right" style="color:#C4B5FD;font-size:14px;font-weight:800;padding-bottom:10px;">${proposal?.currency || "USD"} ${proposal?.bidAmount || proposal?.budget || 0}</td>
            </tr>
            ${proposal?.estimatedDays ? `
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;">Estimated Timeline</td>
              <td align="right" style="color:#34D399;font-size:13px;font-weight:700;">${proposal.estimatedDays} Days</td>
            </tr>` : ""}
          </table>
        </div>

        ${renderCtaButton(ctaText, ctaUrl)}
      `,
    }),
  });
};

const sendDeliverableNotification = (recipientEmail, recipientName, deliverable, project, status = "submitted") => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const firstName = recipientName ? recipientName.split(" ")[0] : "there";
  const isApproved = status === "approved";

  const subject = isApproved
    ? `Deliverable Approved 🎉 — "${project?.title || "Project"}"`
    : `Deliverable Submitted for Review — "${project?.title || "Project"}"`;

  const titleText = isApproved ? "Deliverable Approved 🎉" : "Deliverable Ready for Review 🚀";

  return send({
    to:      recipientEmail,
    subject,
    html: renderEmailWrapper({
      title: titleText,
      preheader: `Work update on "${project?.title || "Project"}"`,
      bodyHtml: `
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:800;margin:0 0 16px 0;letter-spacing:-0.03em;line-height:1.3;">
          ${titleText}
        </h1>

        <p style="color:#E2E8F0;margin:0 0 24px 0;font-size:15px;line-height:1.7;">
          Hi <strong style="color:#FFFFFF;">${firstName}</strong>,<br/>
          ${isApproved 
            ? `The deliverable <strong style="color:#C4B5FD;">"${deliverable?.title || "Milestone Deliverable"}"</strong> for project "${project?.title}" has been approved!`
            : `A new deliverable <strong style="color:#C4B5FD;">"${deliverable?.title || "Milestone Deliverable"}"</strong> has been submitted for your review.`}
        </p>

        <div style="background:linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px 24px;margin:24px 0;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;padding-bottom:10px;">Deliverable Title</td>
              <td align="right" style="color:#FFFFFF;font-size:13px;font-weight:700;padding-bottom:10px;">${deliverable?.title || "Deliverable"}</td>
            </tr>
            <tr>
              <td style="color:#94A3B8;font-size:13px;font-weight:600;">Status</td>
              <td align="right" style="color:${isApproved ? "#34D399" : "#FBBF24"};font-size:13px;font-weight:700;">${isApproved ? "✓ Approved" : "⏳ Pending Review"}</td>
            </tr>
          </table>
        </div>

        ${renderCtaButton(isApproved ? "View Project →" : "Review Deliverable →", `${clientUrl}/dashboard`)}
      `,
    }),
  });
};

module.exports = {
  send,
  sendWelcome,
  sendPasswordReset,
  sendInvoice,
  sendSubscriptionConfirm,
  sendClientInvite,
  sendPaymentReceipt,
  sendMeetingReminder,
  sendProposalNotification,
  sendDeliverableNotification,
};

