import { Resend } from 'resend'
import { LaunchAnnouncement } from './launch-announcement.js'

interface SendLaunchEmailOptions {
  to: string
  name?: string
  githubUrl?: string
}

export async function sendLaunchEmail({ to, name, githubUrl }: SendLaunchEmailOptions) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'WhateverOPS <noreply@example.com>',
    to,
    subject: `${name ? `${name}, ` : ''}WhateverOPS is live — your unified ops dashboard awaits`,
    react: LaunchAnnouncement({ name, githubUrl }),
  })

  if (error) {
    throw new Error(`Failed to send launch email to ${to}: ${error.message}`)
  }

  return data
}
