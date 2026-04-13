import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendNewMessageEmail({
    toEmail,
    toName,
    fromName,
    messagePreview,
    conversationId,
}: {
    toEmail: string
    toName: string
    fromName: string
    messagePreview: string
    conversationId: string
}) {
    if (!resend) return // skip silently if not configured

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ohmplace.vercel.app'

    await resend.emails.send({
        from: 'OhmPlace <notifications@ohmplace.com>',
        to: toEmail,
        subject: `New message from ${fromName}`,
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
                <img src="${appUrl}/logo.png" alt="OhmPlace" style="width:40px;height:40px;border-radius:8px;margin-bottom:16px" />
                <h2 style="margin:0 0 8px;font-size:20px;color:#1a202c">New message from ${fromName}</h2>
                <p style="margin:0 0 16px;color:#4a5568;font-size:15px">
                    Hey ${toName}, you have a new message on OhmPlace.
                </p>
                <div style="background:#f7fafc;border-left:4px solid #22c1c3;padding:12px 16px;border-radius:4px;margin-bottom:24px">
                    <p style="margin:0;color:#2d3748;font-size:14px;font-style:italic">"${messagePreview}"</p>
                </div>
                <a href="${appUrl}/dashboard/messages?id=${conversationId}"
                    style="display:inline-block;background:#22c1c3;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
                    Reply on OhmPlace
                </a>
                <p style="margin:24px 0 0;color:#a0aec0;font-size:12px">
                    You&apos;re receiving this because someone messaged you on OhmPlace.
                </p>
            </div>
        `,
    }).catch((err) => {
        console.error('Failed to send email notification:', err)
    })
}
