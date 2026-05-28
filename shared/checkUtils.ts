import type { Check, ResolvedCheck, ResolvedCheckStatus } from './check.js'

/**
 * Determines if a check is currently healthy (UP) based on its last ping, interval, and grace period.
 */
export function isCheckHealthy(check: Pick<Check, 'lastPing' | 'intervalSeconds' | 'graceSeconds'>): boolean {
  const { lastPing, intervalSeconds, graceSeconds } = check
  if (!lastPing)
    return true // If it has never been pinged, treat as healthy/new until first ping

  const pingTime = new Date(lastPing).getTime()
  const expirationTime = pingTime + (intervalSeconds * 1000) + (graceSeconds * 1000)
  return Date.now() < expirationTime
}

export function resolveCheckStatus(check: Pick<Check, 'status' | 'lastPing' | 'intervalSeconds' | 'graceSeconds'>): ResolvedCheckStatus {
  if (check.status === 'PAUSED') return 'PAUSED'
  if (check.status === 'NEW') return 'NEW'

  // If status is UP, check if we missed pings and transition to LATE or DOWN dynamically
  if (check.status === 'UP' && check.lastPing) {
    const pingTime = new Date(check.lastPing).getTime()
    const now = Date.now()
    const intervalMs = check.intervalSeconds * 1000
    const graceMs = check.graceSeconds * 1000

    if (now >= pingTime + intervalMs + graceMs) {
      return 'DOWN'
    } else if (now >= pingTime + intervalMs) {
      return 'LATE'
    }
  }

  // If it's DOWN in DB, and hasn't been pinged to resolve to UP, it stays DOWN
  return check.status
}

export function formatCheck(check: Check): ResolvedCheck {
  return {
    ...check,
    status: resolveCheckStatus(check),
    timeout_seconds: check.graceSeconds,
  }
}
