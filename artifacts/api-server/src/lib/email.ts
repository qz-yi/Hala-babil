import nodemailer from "nodemailer";
import { logger } from "./logger.js";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  }

  logger.warn("SMTP not configured — falling back to Ethereal test account");
  return null;
}

async function getTransporter() {
  const real = createTransporter();
  if (real) return { transport: real, isEthereal: false };

  const testAccount = await nodemailer.createTestAccount();
  const transport = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return { transport, isEthereal: true };
}

function buildOtpEmailHtml(otpCode: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>رمز التحقق - هلا بابل</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d0d;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d0d;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:0 0 30px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#7c3aed,#db2777);border-radius:50%;width:70px;height:70px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:32px;line-height:70px;">🔐</span>
                  </td>
                </tr>
              </table>
              <h1 style="color:#fff;font-size:28px;margin:16px 0 4px;font-weight:700;">هلا بابل</h1>
              <p style="color:#9ca3af;font-size:14px;margin:0;">Hilla Connect</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#1a1a2e;border-radius:20px;border:1px solid #2d2d4e;overflow:hidden;">

                <!-- Purple accent bar -->
                <tr>
                  <td style="background:linear-gradient(90deg,#7c3aed,#db2777);height:4px;"></td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#fff;font-size:22px;margin:0 0 12px;font-weight:600;">
                      رمز التحقق لإعادة تعيين كلمة المرور
                    </h2>
                    <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 32px;">
                      تلقّينا طلباً لإعادة تعيين كلمة مرور حسابك في هلا بابل.
                      استخدم الرمز أدناه لإتمام العملية.
                    </p>

                    <!-- OTP Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                      <tr>
                        <td align="center">
                          <div style="background:linear-gradient(135deg,#1e1b4b,#2d1b69);border:2px solid #7c3aed;border-radius:16px;padding:28px 40px;display:inline-block;">
                            <p style="color:#9ca3af;font-size:13px;margin:0 0 10px;letter-spacing:2px;text-transform:uppercase;">رمز التحقق</p>
                            <p style="color:#fff;font-size:48px;font-weight:800;letter-spacing:12px;margin:0;font-family:'Courier New',monospace;">${otpCode}</p>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Timer notice -->
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background-color:#1f1f3a;border-radius:12px;border-right:4px solid #f59e0b;margin:0 0 28px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="color:#fcd34d;font-size:14px;margin:0;font-weight:600;">
                            ⏱ صالح لمدة 5 دقائق فقط
                          </p>
                          <p style="color:#9ca3af;font-size:13px;margin:6px 0 0;">
                            سينتهي صلاحية هذا الرمز تلقائياً. لا تشاركه مع أي شخص.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Security notice -->
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background-color:#1a1a1a;border-radius:12px;border:1px solid #2d2d2d;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.6;">
                            🔒 إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد بأمان.
                            حسابك لا يزال محمياً.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer accent -->
                <tr>
                  <td style="background:linear-gradient(90deg,#db2777,#7c3aed);height:2px;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 0 0;">
              <p style="color:#4b5563;font-size:13px;margin:0 0 6px;">
                © 2026 هلا بابل · Hilla Connect
              </p>
              <p style="color:#374151;font-size:12px;margin:0;">
                هذا البريد أُرسل تلقائياً · يرجى عدم الرد عليه
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<void> {
  const { transport, isEthereal } = await getTransporter();
  const from = process.env.SMTP_FROM || '"هلا بابل" <noreply@hillaconnect.app>';

  const info = await transport.sendMail({
    from,
    to: toEmail,
    subject: `${otpCode} - رمز التحقق من هلا بابل`,
    html: buildOtpEmailHtml(otpCode),
    text: `رمز التحقق الخاص بك هو: ${otpCode}\nصالح لمدة 5 دقائق فقط.`,
  });

  if (isEthereal) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    logger.info({ previewUrl, otpCode }, "Ethereal preview (dev only) — OTP email sent");
  } else {
    logger.info({ messageId: info.messageId, to: toEmail }, "OTP email sent");
  }
}
