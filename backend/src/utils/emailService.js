const nodemailer = require("nodemailer");
const logger = require("./logger");
const config = require("../config");
const {
  buildInvitationTemplate,
  buildPasswordResetTemplate,
  buildWelcomeTemplate,
} = require("../../templates/email");

class EmailService {
  constructor() {
    this.transporter = null;
    this.provider = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      const preferredProvider = config.email.provider;

      if (preferredProvider === "brevo" && config.brevo?.apiKey) {
        this.provider = "brevo";
        this.initialized = true;
        logger.info("Email service initialized with Brevo API");
        return;
      }

      if (preferredProvider === "resend" && config.resend?.apiKey) {
        this.provider = "resend";
        this.initialized = true;
        logger.info("Email service initialized with Resend API");
        return;
      }

      if (preferredProvider === "sendgrid" && config.sendgrid?.apiKey) {
        this.provider = "sendgrid";
        this.initialized = true;
        logger.info("Email service initialized with SendGrid API");
        return;
      }

      if (preferredProvider === "brevo" && !config.brevo?.apiKey) {
        throw new Error(
          "EMAIL_PROVIDER is set to brevo but BREVO_KEY is not configured",
        );
      }

      if (preferredProvider === "resend" && !config.resend?.apiKey) {
        throw new Error(
          "EMAIL_PROVIDER is set to resend but RESEND_API_KEY is not configured",
        );
      }

      if (preferredProvider === "sendgrid" && !config.sendgrid?.apiKey) {
        throw new Error(
          "EMAIL_PROVIDER is set to sendgrid but SENDGRID_API_KEY is not configured",
        );
      }

      if (config.email.user && config.email.password) {
        this.transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port,
          secure: config.email.secure,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          auth: {
            user: config.email.user,
            pass: config.email.password,
          },
        });

        await this.transporter.verify();

        this.provider = "smtp";
        logger.info("SMTP email service initialized and verified");
      } else {
        if (process.env.NODE_ENV === "production") {
          throw new Error("SMTP credentials are not configured");
        }

        const testAccount = await nodemailer.createTestAccount();

        this.transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        this.provider = "smtp";
        logger.info("Email service initialized with Ethereal test account");
      }

      this.initialized = true;
    } catch (error) {
      logger.error("Failed to initialize email service", error);
      this.initialized = false;
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
  }

  async sendInvitation(options) {
    await this.ensureInitialized();

    const { email, role, token, invitedBy } = options;

    const magicLink = `${config.frontendUrl}/invite/verify?token=${token}`;
    const expiresIn = "7 days";

    const template = buildInvitationTemplate({
      email,
      role,
      invitedBy,
      magicLink,
      expiresIn,
    });

    try {
      const info = await this.dispatchEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info(`Invitation email sent to ${email}`, {
        messageId: info.messageId,
        role,
      });

      if (process.env.NODE_ENV !== "production") {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          logger.info(`Preview URL: ${previewUrl}`);
        }
      }

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      logger.error("Failed to send invitation email", error);
      throw error;
    }
  }

  async sendPasswordReset(options) {
    await this.ensureInitialized();

    const { email, token } = options;
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

    const template = buildPasswordResetTemplate({ resetUrl });

    try {
      const info = await this.dispatchEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info(`Password reset email sent to ${email}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      logger.error("Failed to send password reset email", error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendWelcome(options) {
    await this.ensureInitialized();

    const { email, firstName, role } = options;

    const loginUrl = `${config.frontendUrl}/login`;

    const template = buildWelcomeTemplate({
      firstName,
      role,
      loginUrl,
    });

    try {
      const info = await this.dispatchEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info(`Welcome email sent to ${email}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      logger.error("Failed to send welcome email", error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async resendInvitation(options) {
    return this.sendInvitation(options);
  }

  async dispatchEmail({ to, subject, html, text }) {
    await this.ensureInitialized();

    if (this.provider === "brevo") {
      return this.sendWithBrevo({ to, subject, html, text });
    }

    if (this.provider === "resend") {
      return this.sendWithResend({ to, subject, html, text });
    }

    if (this.provider === "sendgrid") {
      return this.sendWithSendGrid({ to, subject, html, text });
    }

    return this.sendWithSmtp({ to, subject, html, text });
  }

  async sendWithSmtp({ to, subject, html, text }) {
    if (!this.transporter) {
      throw new Error("SMTP transporter not initialized");
    }

    return this.transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
      text,
    });
  }

  async sendWithResend({ to, subject, html, text }) {
    const from = config.resend.from || config.email.from;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resend.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Resend API error (${response.status}): ${details}`);
    }

    const data = await response.json();
    return { messageId: data?.id };
  }

  async sendWithBrevo({ to, subject, html, text }) {
    const from = config.brevo.from || config.email.from;
    const parsed = this.parseFromAddress(from);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": config.brevo.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: parsed.name, email: parsed.email },
        to: Array.isArray(to)
          ? to.map((email) => ({ email }))
          : [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Brevo API error (${response.status}): ${details}`);
    }

    const data = await response.json();
    return { messageId: data?.messageId };
  }

  async sendWithSendGrid({ to, subject, html, text }) {
    const from = config.sendgrid.from || config.email.from;
    const toList = Array.isArray(to) ? to : [to];

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.sendgrid.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: toList.map((email) => ({ email })) }],
        from: this.parseFromAddress(from),
        subject,
        content: [
          { type: "text/plain", value: text || "" },
          { type: "text/html", value: html || "" },
        ],
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`SendGrid API error (${response.status}): ${details}`);
    }

    return {
      messageId: response.headers.get("x-message-id") || null,
    };
  }

  parseFromAddress(from) {
    const match = typeof from === "string" ? from.match(/^(.*)<(.+)>$/) : null;
    if (!match) {
      return { email: from };
    }

    return {
      name: match[1].trim().replace(/^"|"$/g, ""),
      email: match[2].trim(),
    };
  }
}

module.exports = new EmailService();
