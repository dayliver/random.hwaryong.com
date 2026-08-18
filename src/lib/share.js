// UTF-8-safe base64url codec for putting a roster into a share URL's query string.
export function encodeRoster(name, membersText) {
  const json = JSON.stringify({ n: name, m: membersText })
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeRoster(code) {
  const base64 = code.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const json = new TextDecoder().decode(bytes)
  const parsed = JSON.parse(json)
  if (typeof parsed.m !== 'string') throw new Error('invalid roster payload')
  return { name: parsed.n ?? '', membersText: parsed.m }
}

export function buildShareUrl(name, membersText) {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set('g', encodeRoster(name, membersText))
  return url.toString()
}
