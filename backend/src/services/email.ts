import nodemailer from 'nodemailer';

const getEmailTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('Email service not configured');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
};

export const sendVerificationCodeEmail = async (to: string, code: string) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    throw new Error('SMTP_FROM not configured');
  }

  const transporter = getEmailTransporter();

  await transporter.sendMail({
    from,
    to,
    subject: 'BIACRM - Codigo de verificacao da empresa',
    text: `Seu codigo para confirmar o cadastro no BIACRM e: ${code}. Ele expira em 50 segundos.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;padding:28px;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;padding:24px;border:1px solid #e2e8f0;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <div style="width:36px;height:36px;background:#0ea5e9;border-radius:10px;color:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:700;">B</div>
            <div>
              <div style="font-size:16px;font-weight:700;color:#0f172a;">BIACRM</div>
              <div style="font-size:12px;color:#64748b;">Confirmacao de cadastro</div>
            </div>
          </div>
          <h2 style="margin:0 0 8px;color:#0f172a;">Confirme sua empresa</h2>
          <p style="margin:0 0 16px;color:#334155;">Use o codigo abaixo para finalizar o cadastro.</p>
          <div style="text-align:center;margin:20px 0;">
            <span style="display:inline-block;background:#0ea5e9;color:#ffffff;font-size:26px;letter-spacing:6px;padding:12px 22px;border-radius:12px;">
              ${code}
            </span>
          </div>
          <p style="margin:0 0 12px;color:#475569;">Este codigo expira em 50 segundos.</p>
          <p style="margin:0;color:#94a3b8;font-size:12px;">Se voce nao solicitou este cadastro, ignore este email.</p>
        </div>
      </div>
    `
  });
};

export const sendPasswordResetCodeEmail = async (to: string, code: string) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    throw new Error('SMTP_FROM not configured');
  }

  const transporter = getEmailTransporter();

  await transporter.sendMail({
    from,
    to,
    subject: 'BIACRM - Codigo para redefinir sua senha',
    text: `Seu codigo para redefinir a senha do BIACRM e: ${code}. Ele expira em 50 segundos.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;padding:28px;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;padding:24px;border:1px solid #e2e8f0;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <div style="width:36px;height:36px;background:#0ea5e9;border-radius:10px;color:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:700;">B</div>
            <div>
              <div style="font-size:16px;font-weight:700;color:#0f172a;">BIACRM</div>
              <div style="font-size:12px;color:#64748b;">Redefinicao de senha</div>
            </div>
          </div>
          <h2 style="margin:0 0 8px;color:#0f172a;">Redefinir senha</h2>
          <p style="margin:0 0 16px;color:#334155;">Use o codigo abaixo para redefinir sua senha.</p>
          <div style="text-align:center;margin:20px 0;">
            <span style="display:inline-block;background:#0ea5e9;color:#ffffff;font-size:26px;letter-spacing:6px;padding:12px 22px;border-radius:12px;">
              ${code}
            </span>
          </div>
          <p style="margin:0 0 12px;color:#475569;">Este codigo expira em 50 segundos.</p>
          <p style="margin:0;color:#94a3b8;font-size:12px;">Se voce nao solicitou esta alteracao, ignore este email.</p>
        </div>
      </div>
    `
  });
};
