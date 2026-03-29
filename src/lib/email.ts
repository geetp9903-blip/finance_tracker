import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendOtpEmail(to: string, otp: string) {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // Fallback if env vars are missing
    if (!user || !pass) {
        console.warn("⚠️ SMTP_USER or SMTP_PASS not set. OTP logged to console.");
        return true;
    }

    try {
        console.log(`[EMAIL] Attempting send to ${to} via ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} (${user})`);
        const info = await transporter.sendMail({
            from: `"Prospera Security" <${user}>`,
            to,
            subject: 'Your Reset PIN Verification Code',
            html: `
                <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; background-color: #f4f4f5; border-radius: 10px;">
                    <h2 style="color: #18181b; text-align: center;">Reset PIN</h2>
                    <p style="color: #52525b; text-align: center;">Use the code below to reset your Prospera PIN.</p>
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px solid #e4e4e7;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #18181b;">${otp}</span>
                    </div>
                    <p style="color: #71717a; font-size: 12px; text-align: center;">If you didn't request this, you can ignore this email. Code expires in 10 minutes.</p>
                </div>
            `,
        });
        return true;
    } catch (error) {
        console.error("Failed to send email:", error);
        return false;
    }
}

export async function sendInactivityWarningEmail(to: string, daysLeft: number) {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        console.warn("⚠️ SMTP_USER or SMTP_PASS not set. Warning email not sent.");
        return true;
    }

    let subject = "";
    let message = "";
    let color = "";

    if (daysLeft === 7) {
        subject = "Action Required: Your Prospera Account has been inactive";
        message = "We noticed you haven't used Prospera in a while. To keep your account and financial data active, please log in and post a transaction within the next 7 days, or your account will be securely deleted.";
        color = "#eab308"; // yellow
    } else if (daysLeft === 3) {
        subject = "Warning: 3 Days Left Until Account Deletion";
        message = "Your Prospera account has remained inactive. You have only 3 days left to log in and post a transaction to retain your data. Otherwise, your account will be permanently erased.";
        color = "#f97316"; // orange
    } else if (daysLeft === 1) {
        subject = "FINAL NOTICE: Account Deletion Tomorrow";
        message = "This is your final warning. Your Prospera account will be permanently deleted tomorrow due to 45 days of inactivity. Please log in immediately and post a transaction to cancel this process.";
        color = "#ef4444"; // red
    }

    try {
        console.log(`[EMAIL] Attempting send inactivity warning to ${to} (${daysLeft} days left)`);
        await transporter.sendMail({
            from: `"Prospera Security" <${user}>`,
            to,
            subject,
            html: `
                <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; background-color: #f4f4f5; border-radius: 10px;">
                    <h2 style="color: ${color}; text-align: center;">Account Inactivity Notice</h2>
                    <p style="color: #52525b; text-align: center;">${message}</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://prospera.app" style="background-color: #18181b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Log In Now</a>
                    </div>
                    <p style="color: #71717a; font-size: 12px; text-align: center;">If you no longer wish to use Prospera, you can ignore this email and your data will be safely removed.</p>
                </div>
            `,
        });
        return true;
    } catch (error) {
        console.error("Failed to send inactivity email:", error);
        return false;
    }
}
