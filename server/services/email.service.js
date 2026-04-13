const nodemailer = require("nodemailer");
const logger     = require("../utils/logger");

// ── Transporter (lazy singleton) ──────────────────────────
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  // All SMTP env vars are optional — falls back to Ethereal (dev preview)
  if (process.env.EMAIL_HOST) {
    _transporter = nodemailer.createTransport({
      host:   process.env.EMAIL_HOST,
      port:   parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: process.env.EMAIL_SECURE === "true", // true for port 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        // Allow self-signed certs in dev
        rejectUnauthorized: process.env.NODE_ENV === "production",
      },
    });
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

// ── Templates ─────────────────────────────────────────────

const sendWelcome = (user) =>
  send({
    to:      user.email,
    subject: `Welcome to Skillora, ${user.name.split(" ")[0]}!`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#fff">
        <div style="margin-bottom:24px">
          <span style="font-size:24px;font-weight:700;color:#635BFF">Skillora</span>
        </div>
        <h1 style="color:#1A1F36;font-size:22px;margin-bottom:8px">Welcome aboard 🚀</h1>
        <p style="color:#1A1F36;font-size:16px;margin-bottom:8px">Hi ${user.name},</p>
        <p style="color:#6B7280;line-height:1.6">
          Your account is ready. Start managing your freelance business smarter —
          track projects, clients, invoices, and get AI-powered insights.
        </p>
        <a href="${process.env.CLIENT_URL}/dashboard"
           style="display:inline-block;margin-top:24px;padding:12px 28px;background:#635BFF;color:#fff;
                  border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
          Go to Dashboard →
        </a>
        <hr style="border:none;border-top:1px solid #E3E8EF;margin:32px 0" />
        <p style="color:#9CA3AF;font-size:12px">
          Skillora · The freelancer's command center<br/>
          <a href="${process.env.CLIENT_URL}" style="color:#635BFF;text-decoration:none">skillora.app</a>
        </p>
      </div>`,
  });

const sendPasswordReset = (user, resetUrl) =>
  send({
    to:      user.email,
    subject: "Reset your Skillora password",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#fff">
        <div style="margin-bottom:24px">
          <span style="font-size:24px;font-weight:700;color:#635BFF">Skillora</span>
        </div>
        <h2 style="color:#1A1F36;font-size:20px;margin-bottom:8px">Password Reset Request</h2>
        <p style="color:#6B7280;line-height:1.6">
          Hi ${user.name}, we received a request to reset your password.
          Click the button below — this link expires in <strong>10 minutes</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;margin-top:20px;padding:12px 28px;background:#635BFF;color:#fff;
                  border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
          Reset Password →
        </a>
        <p style="color:#9CA3AF;font-size:12px;margin-top:24px">
          If you didn't request this, you can safely ignore this email.
          Your password will not be changed.
        </p>
        <hr style="border:none;border-top:1px solid #E3E8EF;margin:24px 0" />
        <p style="color:#9CA3AF;font-size:12px">Skillora Security Team</p>
      </div>`,
  });

const sendInvoice = (user, invoice, clientEmail) =>
  send({
    to:      clientEmail,
    subject: `Invoice ${invoice.invoiceNumber} from ${user.name}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#fff">
        <div style="margin-bottom:24px">
          <span style="font-size:24px;font-weight:700;color:#635BFF">Skillora</span>
        </div>
        <h2 style="color:#1A1F36;font-size:20px;margin-bottom:4px">Invoice ${invoice.invoiceNumber}</h2>
        <p style="color:#6B7280;margin-bottom:20px">
          You have received an invoice from <strong>${user.name}</strong>.
        </p>
        <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden">
          <tr style="background:#F6F9FC">
            <td style="padding:12px 16px;font-weight:600;color:#1A1F36">Total Amount</td>
            <td style="padding:12px 16px;text-align:right;font-weight:700;color:#635BFF;font-size:18px">
              ${invoice.currency} ${invoice.total.toFixed(2)}
            </td>
          </tr>
          <tr style="background:#fff">
            <td style="padding:12px 16px;color:#6B7280;border-top:1px solid #E3E8EF">Due Date</td>
            <td style="padding:12px 16px;text-align:right;color:#6B7280;border-top:1px solid #E3E8EF">
              ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-IN") : "On receipt"}
            </td>
          </tr>
        </table>
        ${invoice.notes ? `<p style="color:#6B7280;margin-top:16px;font-size:14px">${invoice.notes}</p>` : ""}
        <hr style="border:none;border-top:1px solid #E3E8EF;margin:24px 0" />
        <p style="color:#9CA3AF;font-size:12px">Sent via Skillora · ${user.email}</p>
      </div>`,
  });

const sendSubscriptionConfirm = (user, plan) =>
  send({
    to:      user.email,
    subject: `You're now on Skillora ${plan} 🎉`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#fff">
        <div style="margin-bottom:24px">
          <span style="font-size:24px;font-weight:700;color:#635BFF">Skillora</span>
        </div>
        <h2 style="color:#635BFF;font-size:20px;margin-bottom:8px">Subscription Activated 🎉</h2>
        <p style="color:#1A1F36;font-size:16px">Hi ${user.name},</p>
        <p style="color:#6B7280;line-height:1.6">
          Your <strong style="color:#1A1F36">${plan.charAt(0).toUpperCase() + plan.slice(1)}</strong> plan
          is now active. Enjoy all the premium features!
        </p>
        <a href="${process.env.CLIENT_URL}/settings?tab=billing"
           style="display:inline-block;margin-top:20px;padding:12px 28px;background:#635BFF;color:#fff;
                  border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
          Manage Subscription →
        </a>
        <hr style="border:none;border-top:1px solid #E3E8EF;margin:24px 0" />
        <p style="color:#9CA3AF;font-size:12px">
          Questions? Reply to this email or visit
          <a href="${process.env.CLIENT_URL}" style="color:#635BFF;text-decoration:none">skillora.app</a>
        </p>
      </div>`,
  });

const sendClientInvite = (client, inviteToken) => {
  const inviteUrl = `${process.env.CLIENT_URL}/client/accept-invite?token=${inviteToken}`;
  return send({
    to:      client.email,
    subject: "You've been invited to the client portal",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Hi ${client.name},</h2>
        <p>You've been invited to access your client portal where you can view invoices and project updates.</p>
        <p>Click the button below to set your password and activate your account. This link expires in 48 hours.</p>
        <a href="${inviteUrl}"
           style="display:inline-block;padding:12px 24px;background:#635BFF;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Accept Invite
        </a>
        <p style="color:#6B7280;font-size:13px">If you weren't expecting this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { send, sendWelcome, sendPasswordReset, sendInvoice, sendSubscriptionConfirm, sendClientInvite };
