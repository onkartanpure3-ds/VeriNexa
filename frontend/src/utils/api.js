/**
 * VeriNexa API Client
 * Connects to configured production backend (VITE_API_URL e.g. on Render)
 * or auto-discovers local dev server ports (8001, 8000).
 */

let discoveredBaseUrl = null

function getEnvApiUrl() {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '')
  }
  return null
}

export async function getApiBaseUrl() {
  const envUrl = getEnvApiUrl()
  if (envUrl) {
    return envUrl
  }

  if (discoveredBaseUrl) {
    return discoveredBaseUrl
  }

  const ports = [8001, 8000]
  for (const port of ports) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1200)
      const res = await fetch(`http://localhost:${port}/api/system/status`, {
        method: 'GET',
        signal: controller.signal,
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
  return 'http://localhost:8001'
}

export async function apiFetch(endpoint, options = {}) {
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const envUrl = getEnvApiUrl()

  // 1. Production / Configured Environment URL (Vercel -> Render)
  if (envUrl) {
    const url = `${envUrl}${cleanPath}`
    return await fetch(url, options)
  }

  // 2. Localhost Auto-Discovery Fallback for local development
  const candidatePorts = discoveredBaseUrl
    ? [discoveredBaseUrl.includes('8001') ? 8001 : 8000, discoveredBaseUrl.includes('8001') ? 8000 : 8001]
    : [8001, 8000]

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

