import nodemailer from "nodemailer";

const hasZohoCreds = Boolean(process.env.ZOHO_EMAIL && process.env.ZOHO_PASSWORD);

const transporter = hasZohoCreds
  ? nodemailer.createTransport({
      host: process.env.ZOHO_SMTP_HOST ?? "smtp.zoho.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_PASSWORD,
      },
    })
  : null;

function otpEmailHtml(firstName: string, otp: string, purpose: "verify" | "reset") {
  const heading = purpose === "verify" ? "Verify your email" : "Reset your password";
  const intro =
    purpose === "verify"
      ? "Thanks for signing up! Enter the code below to verify your email address."
      : "We received a request to reset your password. Enter the code below to continue.";
  const expiryNote =
    purpose === "verify"
      ? "This code expires in <strong>15 minutes</strong>."
      : "This code expires in <strong>15 minutes</strong>.";

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a1a; margin-bottom: 12px;">${heading}, ${firstName}</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.5;">${intro}</p>
      <div style="margin: 32px 0; text-align: center;">
        <div style="display: inline-block; background: #fef3c7; border: 2px dashed #d97706;
                    border-radius: 8px; padding: 20px 40px; font-size: 36px; font-weight: 700;
                    letter-spacing: 8px; color: #92400e; font-family: monospace;">
          ${otp}
        </div>
      </div>
      <p style="color: #888; font-size: 14px; text-align: center;">${expiryNote}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="color: #aaa; font-size: 12px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;
}

export async function sendVerificationEmail(to: string, firstName: string, otp: string) {
  if (!transporter) {
    console.log("\n=================== EMAIL (DEV MODE) ===================");
    console.log(`To:      ${to}`);
    console.log(`Subject: Verify your email — OTP: ${otp}`);
    console.log(`Hi ${firstName}, your verification code is: ${otp}`);
    console.log("========================================================\n");
    return;
  }

  await transporter.sendMail({
    from: `"Madhur Sweets" <${process.env.ZOHO_EMAIL}>`,
    to,
    subject: `${otp} is your Madhur Sweets verification code`,
    html: otpEmailHtml(firstName, otp, "verify"),
  });
}

interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactFormEmail(payload: ContactFormPayload) {
  const to = process.env.CONTACT_EMAIL ?? process.env.ZOHO_EMAIL;
  if (!to) {
    console.log("\n=================== CONTACT FORM (NO DESTINATION) ===================");
    console.log(payload);
    console.log("======================================================================\n");
    return;
  }

  if (!transporter) {
    console.log("\n=================== CONTACT FORM (DEV MODE) ===================");
    console.log(`To:      ${to}`);
    console.log(`From:    ${payload.name} <${payload.email}>`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Message: ${payload.message}`);
    console.log("================================================================\n");
    return;
  }

  await transporter.sendMail({
    from: `"Madhur Sweets Website" <${process.env.ZOHO_EMAIL}>`,
    to,
    replyTo: payload.email,
    subject: `[Contact Form] ${payload.subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">New contact form submission</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #555; width: 100px;"><strong>Name</strong></td>
            <td style="padding: 8px 0; color: #1a1a1a;">${escapeHtml(payload.name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;"><strong>Email</strong></td>
            <td style="padding: 8px 0; color: #1a1a1a;">
              <a href="mailto:${escapeHtml(payload.email)}" style="color: #d97706;">${escapeHtml(payload.email)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;"><strong>Subject</strong></td>
            <td style="padding: 8px 0; color: #1a1a1a;">${escapeHtml(payload.subject)}</td>
          </tr>
        </table>
        <div style="border-top: 1px solid #eee; padding-top: 16px; margin-top: 16px;">
          <p style="color: #555; margin-bottom: 8px;"><strong>Message</strong></p>
          <p style="color: #1a1a1a; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(payload.message)}</p>
        </div>
        <p style="color: #aaa; font-size: 12px; margin-top: 32px;">
          You can reply directly to this email to respond to ${escapeHtml(payload.name)}.
        </p>
      </div>
    `,
  });
}

interface OrderReceiptItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderReceiptAddress {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

interface OrderReceiptPayload {
  to: string;
  firstName: string;
  orderId: string;
  items: OrderReceiptItem[];
  total: number;
  address: OrderReceiptAddress;
  razorpayPaymentId?: string;
  createdAt?: Date;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildOrderSubject(items: OrderReceiptItem[]): string {
  if (items.length === 0) return "Your order has been successfully placed";

  const firstName = items[0].name;
  const rest = items.length - 1;

  if (rest === 0) {
    return `Your Order for ${firstName} has been successfully placed`;
  }

  // Truncate the first product name so the subject doesn't get unwieldy
  const truncated = firstName.length > 30 ? firstName.slice(0, 30).trimEnd() : firstName;
  const noun = rest === 1 ? "product" : "products";

  return `Your Order for ${truncated} ...+${rest} more ${noun} has been successfully placed`;
}

export async function sendOrderReceiptEmail(payload: OrderReceiptPayload) {
  const {
    to,
    firstName,
    orderId,
    items,
    total,
    address,
    razorpayPaymentId,
    createdAt = new Date(),
  } = payload;

  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #eee; color: #1a1a1a;">${escapeHtml(item.name)}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center; color: #555;">${item.quantity}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; color: #555;">${formatINR(item.price)}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; color: #1a1a1a; font-weight: 600;">${formatINR(item.price * item.quantity)}</td>
        </tr>`
    )
    .join("");

  const dateStr = createdAt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const html = `
    <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 32px; background: #fafafa;">
      <div style="background: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #d97706;">
          <h1 style="color: #d97706; margin: 0 0 4px 0; font-size: 24px;">Thank you, ${escapeHtml(firstName)}!</h1>
          <p style="color: #555; margin: 0; font-size: 16px;">Your order has been confirmed.</p>
        </div>

        <table style="width: 100%; margin: 24px 0; color: #555; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0;"><strong>Order ID:</strong></td>
            <td style="padding: 4px 0; text-align: right; font-family: monospace; color: #1a1a1a;">${escapeHtml(orderId)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><strong>Order Date:</strong></td>
            <td style="padding: 4px 0; text-align: right; color: #1a1a1a;">${dateStr}</td>
          </tr>
          ${
            razorpayPaymentId
              ? `<tr>
                  <td style="padding: 4px 0;"><strong>Payment ID:</strong></td>
                  <td style="padding: 4px 0; text-align: right; font-family: monospace; color: #1a1a1a;">${escapeHtml(razorpayPaymentId)}</td>
                </tr>`
              : ""
          }
        </table>

        <h2 style="color: #1a1a1a; font-size: 18px; margin: 28px 0 12px 0;">Order Summary</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <thead>
            <tr style="background: #fef3c7;">
              <th style="padding: 12px 8px; text-align: left; color: #92400e; font-size: 13px;">Item</th>
              <th style="padding: 12px 8px; text-align: center; color: #92400e; font-size: 13px;">Qty</th>
              <th style="padding: 12px 8px; text-align: right; color: #92400e; font-size: 13px;">Price</th>
              <th style="padding: 12px 8px; text-align: right; color: #92400e; font-size: 13px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <table style="width: 100%; margin-top: 16px;">
          <tr>
            <td style="padding: 12px 8px; text-align: right; color: #1a1a1a; font-size: 18px; font-weight: 700;">Total Paid:</td>
            <td style="padding: 12px 8px; text-align: right; color: #d97706; font-size: 18px; font-weight: 700; width: 140px;">${formatINR(total)}</td>
          </tr>
        </table>

        <div style="margin-top: 28px; padding-top: 24px; border-top: 1px solid #eee;">
          <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 12px 0;">Delivery Address</h2>
          <p style="color: #555; line-height: 1.6; margin: 0;">
            <strong style="color: #1a1a1a;">${escapeHtml(address.name)}</strong><br/>
            ${escapeHtml(address.line1)}<br/>
            ${address.line2 ? escapeHtml(address.line2) + "<br/>" : ""}
            ${escapeHtml(address.city)}, ${escapeHtml(address.state)} - ${escapeHtml(address.pincode)}<br/>
            📞 ${escapeHtml(address.phone)}
          </p>
        </div>

        <div style="margin-top: 32px; padding: 16px; background: #fef3c7; border-radius: 6px; text-align: center;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            We're preparing your order with care. You'll receive another email when it ships.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 28px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
          Questions about your order? Reply to this email or contact us at madhursweets@zohomail.in
        </p>
      </div>
    </div>
  `;

  const subject = buildOrderSubject(items);

  if (!transporter) {
    console.log("\n=================== ORDER RECEIPT (DEV MODE) ===================");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Total:   ${formatINR(total)}`);
    console.log("================================================================\n");
    return;
  }

  await transporter.sendMail({
    from: `"Madhur Sweets" <${process.env.ZOHO_EMAIL}>`,
    to,
    subject,
    html,
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendPasswordResetEmail(to: string, firstName: string, otp: string) {
  if (!transporter) {
    console.log("\n=================== EMAIL (DEV MODE) ===================");
    console.log(`To:      ${to}`);
    console.log(`Subject: Reset your password — OTP: ${otp}`);
    console.log(`Hi ${firstName}, your reset code is: ${otp}`);
    console.log("========================================================\n");
    return;
  }

  await transporter.sendMail({
    from: `"Madhur Sweets" <${process.env.ZOHO_EMAIL}>`,
    to,
    subject: `${otp} is your Madhur Sweets password reset code`,
    html: otpEmailHtml(firstName, otp, "reset"),
  });
}
