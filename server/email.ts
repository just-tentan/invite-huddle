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
  guestName?: string;
  hostName?: string;
  token: string;
  baseUrl: string;
}

interface CancellationEmailParams {
  to: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string;
  hostName: string;
  guestName?: string;
}

export async function sendCancellationEmail({
  to,
  eventTitle,
  eventDate,
  eventLocation,
  hostName,
  guestName
}: CancellationEmailParams): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: `EventHost <onboarding@resend.dev>`,
      to: [to],
      subject: `Event Cancelled: ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626; margin-bottom: 20px;">Event Cancelled</h1>
          ${guestName ? `<p style="color: #374151; margin-bottom: 20px;">Hi ${guestName},</p>` : ''}
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
            <h2 style="margin: 0 0 10px 0; color: #1e293b;">${eventTitle}</h2>
            
            <div style="margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>📅 Was scheduled for:</strong> ${eventDate}</p>
              ${eventLocation ? `<p style="margin: 5px 0;"><strong>📍 Location:</strong> ${eventLocation}</p>` : ''}
              <p style="margin: 5px 0;"><strong>👤 Host:</strong> ${hostName}</p>
            </div>
          </div>

          <p style="color: #374151; margin: 20px 0;">
            We regret to inform you that this event has been cancelled by the host. 
            ${guestName ? 'Thank you for your interest, and we apologize for any inconvenience.' : 'We apologize for any inconvenience this may cause.'}
          </p>

          <p style="color: #6b7280; margin: 20px 0;">
            If you have any questions, please contact the host directly.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Sent by EventHost - Private Event Management Platform
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Resend cancellation email error:', error);
      return false;
    }

    console.log('Cancellation email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return false;
  }
}

export async function sendInvitationEmail({
  to,
  eventTitle,
  eventDescription,
  eventDate,
  eventLocation,
  inviteUrl,
  hostEmail,
  guestName,
  hostName,
  token,
  baseUrl
}: InvitationEmailParams): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: `EventHost <onboarding@resend.dev>`,
      to: [to],
      subject: `You're invited to ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">You're Invited!</h1>
          ${guestName ? `<p style="color: #374151; margin-bottom: 20px;">Hi ${guestName},</p>` : ''}
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px 0; color: #1e293b;">${eventTitle}</h2>
            ${eventDescription ? `<p style="color: #64748b; margin: 5px 0;">${eventDescription}</p>` : ''}
            
            <div style="margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>📅 When:</strong> ${eventDate}</p>
              ${eventLocation ? `<p style="margin: 5px 0;"><strong>📍 Where:</strong> ${eventLocation}</p>` : ''}
              <p style="margin: 5px 0;"><strong>👤 Host:</strong> ${hostName ? `${hostName} (${hostEmail})` : hostEmail}</p>
            </div>
          </div>

          <p style="color: #374151; margin: 20px 0;">
            ${guestName ? `${hostName ? hostName : 'The event host'} has personally invited you to this private event.` : 'You\'ve been personally invited to this private event.'} Click the button below to view details and RSVP:
          </p>

          <p style="color: #374151; margin: 20px 0; text-align: center; font-weight: bold;">
            Please respond to this invitation:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <table style="margin: 0 auto; border-spacing: 10px;">
              <tr>
                <td>
                  <a href="${baseUrl}/api/rsvp/${token}/yes" 
                     style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; min-width: 80px; text-align: center;">
                    ✓ Yes
                  </a>
                </td>
                <td>
                  <a href="${baseUrl}/api/rsvp/${token}/maybe" 
                     style="background-color: #ca8a04; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; min-width: 80px; text-align: center;">
                    ? Maybe
                  </a>
                </td>
                <td>
                  <a href="${baseUrl}/api/rsvp/${token}/no" 
                     style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; min-width: 80px; text-align: center;">
                    ✗ No
                  </a>
                </td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #2563eb; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 14px;">
              View Full Event Details
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