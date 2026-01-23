import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send email via Resend
    const result = await resend.emails.send({
      from: 'ABA Sensei <onboarding@resend.dev>',
      to: 'francosimon@hotmail.com',
      replyTo: email,
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    })

    if (result.error) {
      console.error('[v0] Resend error:', result.error)
      return Response.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return Response.json({ success: true, id: result.data?.id })
  } catch (error) {
    console.error('[v0] Contact API error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
