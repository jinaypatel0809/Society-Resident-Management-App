const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || "smtp.gmail.com",
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * sendEmail({ to, subject, html })
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"SocietyMS" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    // Email failure should never crash the main flow
    console.error("Email send failed:", err.message);
  }
};

// ── Email templates ────────────────────────────────────────────────

const paymentVerifiedEmail = ({ name, amount, month, year, transactionId }) => ({
  subject: "✅ Payment Verified — SocietyMS",
  html: `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;padding:32px 24px;background:#f9fafb;border-radius:16px;">
      <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e7eb;">
        <h2 style="color:#16a34a;margin:0 0 4px;">Payment Verified ✅</h2>
        <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Your maintenance payment has been confirmed by the admin.</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#9ca3af;">Resident</td><td style="font-weight:600;color:#111827;">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#9ca3af;">Period</td><td style="font-weight:600;color:#111827;">${month} ${year}</td></tr>
          <tr><td style="padding:8px 0;color:#9ca3af;">Amount</td><td style="font-weight:700;color:#16a34a;font-size:16px;">₹${amount}</td></tr>
          ${transactionId ? `<tr><td style="padding:8px 0;color:#9ca3af;">Transaction ID</td><td style="font-weight:600;color:#111827;">${transactionId}</td></tr>` : ""}
        </table>

        <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">Thank you for your timely payment. — SocietyMS</p>
      </div>
    </div>
  `,
});

const paymentRejectedEmail = ({ name, amount, month, year, reason }) => ({
  subject: "❌ Payment Rejected — SocietyMS",
  html: `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;padding:32px 24px;background:#f9fafb;border-radius:16px;">
      <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e7eb;">
        <h2 style="color:#dc2626;margin:0 0 4px;">Payment Rejected ❌</h2>
        <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Unfortunately, your payment submission was rejected by the admin.</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#9ca3af;">Resident</td><td style="font-weight:600;color:#111827;">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#9ca3af;">Period</td><td style="font-weight:600;color:#111827;">${month} ${year}</td></tr>
          <tr><td style="padding:8px 0;color:#9ca3af;">Amount</td><td style="font-weight:700;color:#dc2626;font-size:16px;">₹${amount}</td></tr>
          <tr><td style="padding:8px 0;color:#9ca3af;vertical-align:top;">Reason</td><td style="color:#dc2626;font-weight:600;">${reason || "Not specified"}</td></tr>
        </table>

        <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">Please re-submit your payment with correct details. — SocietyMS</p>
      </div>
    </div>
  `,
});

const billAddedEmail = ({ name, amount, month, year, dueDate }) => ({
  subject: `🧾 New Maintenance Bill — ${month} ${year}`,
  html: `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;padding:32px 24px;background:#f9fafb;border-radius:16px;">
      <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e7eb;">
        <h2 style="color:#1d4ed8;margin:0 0 4px;">New Maintenance Bill 🧾</h2>
        <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">A new maintenance bill has been generated for you.</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#9ca3af;">Resident</td><td style="font-weight:600;color:#111827;">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#9ca3af;">Period</td><td style="font-weight:600;color:#111827;">${month} ${year}</td></tr>
          <tr><td style="padding:8px 0;color:#9ca3af;">Amount Due</td><td style="font-weight:700;color:#1d4ed8;font-size:16px;">₹${amount}</td></tr>
          <tr><td style="padding:8px 0;color:#9ca3af;">Due Date</td><td style="font-weight:600;color:#dc2626;">${dueDate}</td></tr>
        </table>

        <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">Please log in to SocietyMS to pay your bill before the due date. — SocietyMS</p>
      </div>
    </div>
  `,
});

module.exports = { sendEmail, paymentVerifiedEmail, paymentRejectedEmail, billAddedEmail };