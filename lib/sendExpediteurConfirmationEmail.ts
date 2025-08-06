import nodemailer from 'nodemailer';

export async function sendExpediteurConfirmationEmail(expediteur: {
  email: string;
  nom: string | null;
  token: string;
}) {
  // AWS SES nécessite des identifiants SMTP spécifiques, pas des Access Keys
  const transporter = nodemailer.createTransport({
    host: 'email-smtp.eu-west-1.amazonaws.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const confirmationLink = `https://sendora.fr/auth/confirmer-expediteur?token=${expediteur.token}`;

  await transporter.sendMail({
    from: 'Sendora <noreply@sendora.fr>',
    to: expediteur.email,
    subject: `Confirmez votre adresse d'expéditeur`,
    html: `
      <!DOCTYPE html>
      <html lang="fr">
        <body style="background: #f9f9fb; margin: 0; padding: 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9f9fb; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #e6e6f0; padding: 32px;">
                  <!-- en-tête -->
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <img src="https://www.sendora.fr/Sendora.png" alt="Sendora" width="180" style="display: block; margin: 0 auto 8px auto;" />
                      <h1 style="font-family: Arial, sans-serif; font-size: 28px; color: #222; margin: 0;">
                        Confirmez votre adresse d'expéditeur
                      </h1>
                    </td>
                  </tr>

                  <!-- message -->
                  <tr>
                    <td style="font-family: Arial, sans-serif; color: #222; font-size: 18px; padding-bottom: 24px;">
                      Bonjour${expediteur.nom ? ` ${expediteur.nom}` : ''},<br><br>
                      Vous avez été ajouté comme expéditeur sur Sendora.<br>
                      Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et pouvoir envoyer des emails depuis cette adresse :
                    </td>
                  </tr>

                  <!-- bouton principal -->
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <a
                        href="${confirmationLink}"
                        style="
                          background: #6c43e0;
                          color: #fff;
                          padding: 12px 24px;
                          border-radius: 8px;
                          text-decoration: none;
                          font-weight: bold;
                          font-size: 16px;
                          display: inline-block;
                        "
                      >
                        Valider mon adresse d'expéditeur
                      </a>
                    </td>
                  </tr>

                  <!-- info d'expiration -->
                  <tr>
                    <td style="font-family: Arial, sans-serif; color: #222; font-size: 16px; padding-top: 24px;">
                      Ce lien expirera dans 24h. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
                    </td>
                  </tr>

                  <!-- lien en clair -->
                  <tr>
                    <td style="padding: 16px 0;">
                      <hr style="border: none; border-top: 1px solid #ccc; margin: 16px 0;">
                    </td>
                  </tr>
                  <tr>
                    <td style="font-family: Arial, sans-serif; color: #222; font-size: 16px; padding-bottom: 16px;">
                      <b>Vous rencontrez des problèmes ?</b><br>
                      Copiez et collez ce lien dans votre navigateur :<br>
                      <a
                        href="${confirmationLink}"
                        style="color: #6c43e0; word-break: break-all;"
                      >
                        ${confirmationLink}
                      </a>
                    </td>
                  </tr>

                  <!-- footer -->
                  <tr>
                    <td align="center" style="font-family: Arial, sans-serif; color: #bbb; font-size: 13px; padding-top: 24px;">
                      Sendora • Plateforme d'emailing simple et efficace<br>
                      <a href="https://www.sendora.fr/conditions" style="color: #bbb;">Conditions générales</a> •
                      <a href="https://www.sendora.fr/confidentialite" style="color: #bbb;">Politique de confidentialité</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
} 