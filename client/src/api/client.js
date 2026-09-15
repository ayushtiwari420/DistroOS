import { getAccessToken } from '../context/AuthContext'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

let isRefreshing = false
let refreshSubscribers = []

const subscribeTokenRefresh = (resolve, reject) => {
  refreshSubscribers.push({ resolve, reject })
}

const onRefreshed = (token) => {
  refreshSubscribers.forEach((sub) => sub.resolve(token))
  refreshSubscribers = []
}

const onRefreshFailed = (err) => {
  refreshSubscribers.forEach((sub) => sub.reject(err))
  refreshSubscribers = []
}

export const apiClient = async (endpoint, options = {}) => {
  const token = getAccessToken()
  const isFormData = options.body instanceof FormData

  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const config = {
    credentials: 'include',
    ...options,
    headers,
  }

  let response = await fetch(`${BASE_URL}${endpoint}`, config)

  // Handle 401 Unauthorized — Attempt silent refresh if token expired
  if (response.status === 401 && !options._retry && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
    options._retry = true

    if (!isRefreshing) {
      isRefreshing = true
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        const refreshData = await refreshRes.json()

        if (refreshRes.ok && refreshData.accessToken) {
          onRefreshed(refreshData.accessToken)
          isRefreshing = false

          headers.Authorization = `Bearer ${refreshData.accessToken}`
          response = await fetch(`${BASE_URL}${endpoint}`, { ...config, headers })
        } else {
          const err = new Error(refreshData.message || 'Session expired.')
          onRefreshFailed(err)
          isRefreshing = false
          throw err
        }
      } catch (err) {
        onRefreshFailed(err)
        isRefreshing = false
        throw err
      }
    } else {
      // Queue requests until refresh completes
      const newToken = await new Promise((resolve, reject) => {
        subscribeTokenRefresh(resolve, reject)
      })
      headers.Authorization = `Bearer ${newToken}`
      response = await fetch(`${BASE_URL}${endpoint}`, { ...config, headers })
    }
  }

  const data = await response.json()
  if (!response.ok) {
    const err = new Error(data.message || 'API request failed.')
    err.status = response.status
    err.errors = data.errors || null
    throw err
  }
  return data
}
