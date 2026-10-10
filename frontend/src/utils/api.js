/**
 * VeriNexa API Auto-Discovery Client
 * Automatically connects to the backend whether running on port 8000 or 8001.
 */

let discoveredBaseUrl = null

export async function getApiBaseUrl() {
  if (discoveredBaseUrl) {
    return discoveredBaseUrl
  }

  const ports = [8000, 8001]
  for (const port of ports) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1200)
      const res = await fetch(`http://localhost:${port}/api/system/status`, {
        method: 'GET',
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      if (res.ok) {
        discoveredBaseUrl = `http://localhost:${port}`
        return discoveredBaseUrl
      }
    } catch {
      // Try next port
    }
  }

  // Default fallback if backend is still starting up
  return 'http://localhost:8000'
}

export async function apiFetch(endpoint, options = {}) {
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  // Try port 8000 first, then 8001
  const candidatePorts = discoveredBaseUrl 
    ? [discoveredBaseUrl.includes('8001') ? 8001 : 8000, discoveredBaseUrl.includes('8001') ? 8000 : 8001]
    : [8000, 8001]

  let lastError = null

  for (const port of candidatePorts) {
    try {
      const url = `http://localhost:${port}${cleanPath}`
      const res = await fetch(url, options)
      discoveredBaseUrl = `http://localhost:${port}`
      return res
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error('Failed to connect to VeriNexa backend server.')
}
