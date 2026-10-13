/** What can go wrong calling Bedrock from a browser, with messages written for the person who clicked Run. */
export type BedrockErrorKind = 'credentials' | 'expired' | 'access' | 'model' | 'region' | 'throttle' | 'quota' | 'network' | 'timeout' | 'rejected' | 'server' | 'cancelled' | 'other'

export class BedrockError extends Error {
  constructor(message: string, public kind: BedrockErrorKind, public code = '', public status = 0) {
    super(message)
    this.name = 'BedrockError'
  }
}

/** Error types worth another attempt (bedrock_client.py TRANSIENT, plus a bare 429/5xx). */
export const TRANSIENT = new Set(['ThrottlingException', 'ModelTimeoutException', 'ServiceUnavailableException', 'InternalServerException', 'ModelNotReadyException'])

/** `x-amzn-ErrorType` looks like "ThrottlingException:http://internal.amazon.com/coral/..." */
export const errorCode = (headerValue: string | null, body: unknown): string => {
  let code = headerValue ?? ''
  if (!code && body && typeof body === 'object') {
    const t = (body as Record<string, unknown>).__type ?? (body as Record<string, unknown>).code
    if (typeof t === 'string') code = t
  }
  return code.split(':')[0]!.split('#').pop()!.trim()
}

export const isTransient = (code: string, status: number): boolean => TRANSIENT.has(code) || status === 429 || status === 503 || status === 500 || status === 408

/** Map one Bedrock error answer to a friendly BedrockError. `model` and `region` only appear in the text; keys never do. */
export function friendlyError(status: number, code: string, message: string, model: string, region: string): BedrockError {
  const msg = message.trim()
  const low = msg.toLowerCase()
  const mk = (text: string, kind: BedrockErrorKind): BedrockError => new BedrockError(text, kind, code, status)
  if (low.includes('operation not allowed'))
    return mk("AWS refused to invoke any Bedrock model for this account ('Operation not allowed'). Your keys are valid; this is an account-level restriction. Check AWS Billing (payment method, unpaid invoices), Service Quotas, Organizations policies, and try the same model in the Bedrock console playground.", 'access')
  switch (code) {
    case 'UnrecognizedClientException':
    case 'InvalidClientTokenId':
      return mk('AWS does not recognise these credentials: the access key ID or the session token is not valid. Check them and the region.', 'credentials')
    case 'InvalidSignatureException':
    case 'SignatureDoesNotMatch':
      return mk('The secret access key does not match the access key ID (or the computer clock is far off). Re-enter the secret key.', 'credentials')
    case 'ExpiredTokenException':
    case 'ExpiredToken':
      return mk('These temporary credentials have expired. Create new ones and connect again.', 'expired')
    case 'IncompleteSignature':
    case 'MissingAuthenticationToken':
      return mk('AWS could not read the credentials. Check that the access key ID and secret are complete.', 'credentials')
    case 'ThrottlingException':
    case 'TooManyRequestsException':
      return mk('Amazon Bedrock is throttling this account (too many requests). Wait a moment and run again, or request a higher quota.', 'throttle')
    case 'ServiceQuotaExceededException':
      return mk(`Your Bedrock quota for ${model} is used up: ${msg}`, 'quota')
    case 'ModelTimeoutException':
      return mk(`${model} took too long to answer. Try again.`, 'timeout')
    case 'ResourceNotFoundException':
      return mk(`Model ${model} is not available in ${region} for this account (${msg || 'not found'}). Pick another model or region.`, 'model')
    case 'ModelNotReadyException':
      return mk(`${model} is still starting up. Try again in a minute.`, 'server')
    case 'ServiceUnavailableException':
    case 'InternalServerException':
      return mk('Amazon Bedrock is temporarily unavailable. Try again in a moment.', 'server')
    case 'ModelErrorException':
      return mk(`The model failed while answering: ${msg}`, 'server')
    case 'AccessDeniedException':
    case 'AccessDenied':
      return mk(
        low.includes('model') || low.includes('bedrock')
          ? `Access to ${model} is denied for these credentials: ${msg}. Enable the model in the Bedrock console (Model access) and allow bedrock:InvokeModel for the IAM user.`
          : `These credentials are valid but not allowed to do this. Grant bedrock:InvokeModel to the IAM user. ${msg}`,
        'access')
    case 'ValidationException':
      if (low.includes('temperature')) return mk(`Bedrock rejected the request: ${msg}`, 'rejected') // the client retries without it
      if (low.includes('model identifier') || low.includes('on-demand throughput') || low.includes('inference profile') || low.includes("doesn't support") || low.includes('not supported'))
        return mk(`${model} cannot be used in ${region} this way (${msg}). Choose a model or inference profile that is available in this region.`, 'model')
      return mk(`Bedrock rejected the request: ${msg}`, 'rejected')
  }
  if (status === 401 || status === 403) return mk(`Bedrock refused the credentials (HTTP ${status}${code ? `, ${code}` : ''}). ${msg}`.trim(), 'credentials')
  if (status === 404) return mk(`Model ${model} was not found in ${region}. Pick another model or region.`, 'model')
  if (status === 429) return mk('Amazon Bedrock is throttling this account. Wait a moment and run again.', 'throttle')
  if (status >= 500) return mk(`Amazon Bedrock returned an error (HTTP ${status}${code ? `, ${code}` : ''}).`, 'server')
  return mk(`Bedrock error${code ? ` ${code}` : ''} (HTTP ${status}): ${msg.slice(0, 300)}`, 'other')
}

export const networkError = (region: string): BedrockError =>
  new BedrockError(
    `Could not reach bedrock-runtime.${region}.amazonaws.com from this browser. Check your connection and any VPN, firewall or ad-blocker that blocks amazonaws.com; ` +
      'a browser also reports a blocked cross-origin (CORS) answer this way. Nothing was sent to the Dooms server.',
    'network')
