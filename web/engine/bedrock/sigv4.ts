/**
 * AWS Signature Version 4 with WebCrypto (browser, worker and Node 20+). Signs one JSON POST; about 100 lines instead of
 * a dependency. Verified against the AWS SigV4 test suite vector and against the `aws4` package (scripts/dooms/selftest).
 */

export interface AwsKeys {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
}

const enc = new TextEncoder()
const hex = (b: ArrayBuffer): string => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('')

export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === 'string' ? enc.encode(data) : data
  return hex(await crypto.subtle.digest('SHA-256', bytes as BufferSource))
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.sign('HMAC', k, enc.encode(data))
}

/** RFC 3986 percent-encoding as AWS wants it (unreserved characters stay, everything else is %XX in upper case). */
export const awsEncode = (s: string): string =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())

/** The canonical URI of a non-S3 service: every segment of the (already encoded) request path is encoded once more. */
export const canonicalPath = (pathname: string): string => pathname.split('/').map((seg) => (seg ? awsEncode(seg) : seg)).join('/') || '/'

const amzDate = (d: Date): string => d.toISOString().replace(/[:-]|\.\d{3}/g, '')

export interface SignInput {
  method: string
  url: string
  /** headers that will be sent AND signed (names are case-insensitive); `host` is added for you */
  headers: Record<string, string>
  body: string
  keys: AwsKeys
  region: string
  service: string
  now?: Date
}

/**
 * Returns the headers to send: the given ones plus x-amz-date, x-amz-security-token (when a session token is given) and
 * Authorization. `host` is signed but not returned: a browser sets it itself and does not allow scripts to.
 */
export async function signRequest(inp: SignInput): Promise<Record<string, string>> {
  const url = new URL(inp.url)
  const date = amzDate(inp.now ?? new Date())
  const day = date.slice(0, 8)
  const headers: Record<string, string> = {}
  for (const [k, v] of Object.entries(inp.headers)) headers[k.toLowerCase()] = v.trim().replace(/\s+/g, ' ')
  headers['x-amz-date'] = date
  if (inp.keys.sessionToken) headers['x-amz-security-token'] = inp.keys.sessionToken
  const signed: Record<string, string> = { ...headers, host: url.host }
  const names = Object.keys(signed).sort()
  const query = [...url.searchParams.entries()]
    .map(([k, v]) => [awsEncode(k), awsEncode(v)] as const)
    .sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  const canonical = [
    inp.method.toUpperCase(), canonicalPath(url.pathname), query,
    names.map((n) => `${n}:${signed[n]}\n`).join(''), names.join(';'), await sha256Hex(inp.body),
  ].join('\n')
  const scope = `${day}/${inp.region}/${inp.service}/aws4_request`
  const toSign = ['AWS4-HMAC-SHA256', date, scope, await sha256Hex(canonical)].join('\n')
  let k: ArrayBuffer = await hmac(enc.encode('AWS4' + inp.keys.secretAccessKey), day)
  for (const part of [inp.region, inp.service, 'aws4_request']) k = await hmac(k, part)
  const signature = hex(await hmac(k, toSign))
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${inp.keys.accessKeyId}/${scope}, SignedHeaders=${names.join(';')}, Signature=${signature}`
  return headers
}
