import { NextRequest, NextResponse } from "next/server";

/**
 * API route to send emails
 * This uses a simple email service or can be configured with nodemailer
 * For production, configure SMTP settings in environment variables
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, recipientName } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, html" },
        { status: 400 }
      );
    }

    // For development, log the email instead of sending
    if (process.env.NODE_ENV === "development") {
      console.log("=== EMAIL (Development Mode) ===");
      console.log("To:", to);
      console.log("Subject:", subject);
      console.log("Recipient:", recipientName);
      console.log("HTML Content Length:", html.length);
      console.log("================================");
      
      return NextResponse.json({
        success: true,
        message: "Email logged in development mode. Configure SMTP for production.",
      });
    }

    // For production, use nodemailer or another email service
    // Example with nodemailer (uncomment and configure):
    /*
    const nodemailer = require("nodemailer");
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to,
      subject: subject,
      html: html,
    });
    */

    // Alternative: Use a service like Resend, SendGrid, etc.
    // Example with Resend:
    /*
    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: to,
      subject: subject,
      html: html,
    });
    */

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}

