import type { Check } from './check.js'

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
