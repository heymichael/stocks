const ALLOWED_EMAILS = [
  'michael@haderachi.ai',
  'michael@heretic.fund',
  'mariam@heretic.fund',
  'mariam@heretic.ventures',
  'alexmader@gmail.com',
]

const ALLOWED_DOMAINS = ['haderach.ai']

function normalizeValue(value: string): string {
  return value.trim().toLowerCase()
}

function parseDomain(email: string): string {
  const atIndex = email.lastIndexOf('@')
  if (atIndex < 0 || atIndex === email.length - 1) {
    return ''
  }
  return email.slice(atIndex + 1).toLowerCase()
}

export function isAuthorizedEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false
  }
  const normalizedEmail = normalizeValue(email)
  const emailDomain = parseDomain(normalizedEmail)
  if (!emailDomain) {
    return false
  }

  const allowedEmails = new Set(ALLOWED_EMAILS.map(normalizeValue))
  const allowedDomains = new Set(ALLOWED_DOMAINS.map(normalizeValue))

  return allowedEmails.has(normalizedEmail) || allowedDomains.has(emailDomain)
}
