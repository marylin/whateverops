import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface LaunchAnnouncementProps {
  name?: string
  githubUrl?: string
}

export function LaunchAnnouncement({
  name = 'there',
  githubUrl = 'https://github.com/whateverops-dev/whateverops',
}: LaunchAnnouncementProps) {
  return (
    <Html>
      <Head />
      <Preview>WhateverOPS is live — your unified ops dashboard awaits</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>WhateverOPS is Live</Heading>

          <Text style={text}>Hey {name},</Text>

          <Text style={text}>
            WhateverOPS is now open source and ready for you to self-host. One dashboard, all your
            ops — no more tab-switching between 15 different services.
          </Text>

          <Section style={reasonsSection}>
            <Heading as="h2" style={h2}>
              3 reasons to try it today
            </Heading>

            <Text style={reason}>
              <strong>1. See everything at a glance.</strong> GitHub, Vercel, Railway, Stripe,
              Sentry, and 10 more integrations — all in one real-time view.
            </Text>

            <Text style={reason}>
              <strong>2. Self-host in 5 minutes.</strong> Clone, add your API keys, deploy to
              Railway + Vercel. Your data stays on your infra.
            </Text>

            <Text style={reason}>
              <strong>3. Built for solo founders.</strong> No team management, no permissions
              matrix. Just you and your stack, unified.
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Link href={githubUrl} style={ctaButton}>
              Get Started on GitHub
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You signed up for early access on BetaList or Uneed. If you no longer want to hear from
            us, just reply with &quot;unsubscribe&quot;.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default LaunchAnnouncement

const main = {
  backgroundColor: '#0a0a0f',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
}

const h1 = {
  color: '#7c3aed',
  fontSize: '28px',
  fontWeight: '700' as const,
  margin: '0 0 24px',
}

const h2 = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600' as const,
  margin: '0 0 16px',
}

const text = {
  color: '#d1d5db',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const reasonsSection = {
  margin: '24px 0',
  padding: '24px',
  backgroundColor: '#1e1e2e',
  borderRadius: '8px',
}

const reason = {
  color: '#d1d5db',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px',
}

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const ctaButton = {
  backgroundColor: '#7c3aed',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: '600' as const,
  padding: '12px 24px',
  textDecoration: 'none',
}

const hr = {
  borderColor: '#2a2a3e',
  margin: '32px 0 16px',
}

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '1.5',
}
