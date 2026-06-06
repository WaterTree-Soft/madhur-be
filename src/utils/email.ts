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
