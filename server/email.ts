import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable must be set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface InvitationEmailParams {
  to: string;
  eventTitle: string;
  eventDescription?: string;
  eventDate: string;
  eventLocation?: string;
  inviteUrl: string;
  hostEmail: string;
}

export async function sendInvitationEmail({
  to,
  eventTitle,
  eventDescription,
  eventDate,
  eventLocation,
  inviteUrl,
  hostEmail
}: InvitationEmailParams): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: `EventHost <noreply@eventhost.com>`,
      to: [to],
      subject: `You're invited to ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">You're Invited!</h1>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px 0; color: #1e293b;">${eventTitle}</h2>
            ${eventDescription ? `<p style="color: #64748b; margin: 5px 0;">${eventDescription}</p>` : ''}
            
            <div style="margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>📅 When:</strong> ${eventDate}</p>
              ${eventLocation ? `<p style="margin: 5px 0;"><strong>📍 Where:</strong> ${eventLocation}</p>` : ''}
              <p style="margin: 5px 0;"><strong>👤 Host:</strong> ${hostEmail}</p>
            </div>
          </div>

          <p style="color: #374151; margin: 20px 0;">
            You've been personally invited to this private event. Click the button below to view details and RSVP:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Invitation & RSVP
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This is a private event invitation. Please don't share this link with others.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Sent by EventHost - Private Event Management Platform
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Resend email error:', error);
      return false;
    }

    console.log('Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return false;
  }
}