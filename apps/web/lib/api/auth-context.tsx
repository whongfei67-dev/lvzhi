"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, storage, initAuth, logout as apiLogout, ApiError } from './client'
import type { User } from './types'

// ============================================
// Context 类型
// ============================================

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  smsLogin: (phone: string, code: string) => Promise<void>
  sendSmsCode: (phone: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================
// Provider
// ============================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 初始化认证状态
  useEffect(() => {
    const init = async () => {
      try {
        const authedUser = await initAuth()
        setUser(authedUser)
      } catch (err) {
        console.error('Auth init error:', err)
        storage.clear()
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    try {
      await api.auth.login(email, password)
      const u = await api.auth.me()
      setUser(u as User)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '登录失败'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    setError(null)
    setLoading(true)
    try {
      await api.auth.register(email, password, displayName)
      const u = await api.auth.me()
      setUser(u as User)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '注册失败'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const sendSmsCode = useCallback(async (phone: string) => {
    setError(null)
    try {
      await api.auth.sendSmsCode(phone)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '发送验证码失败'
      setError(message)
      throw err
    }
  }, [])

  const smsLogin = useCallback(async (phone: string, code: string) => {
    setError(null)
    setLoading(true)
    try {
      await api.auth.smsLogin(phone, code)
      const u = await api.auth.me()
      setUser(u as User)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '登录失败'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setError(null)
    try {
      await apiLogout()
    } finally {
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await api.auth.me()
      setUser(currentUser as User)
    } catch (err) {
      console.error('Refresh user error:', err)
      if (err instanceof ApiError && err.statusCode === 401) {
        setUser(null)
      }
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        smsLogin,
        sendSmsCode,
        logout,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// ============================================
// 高阶组件
// ============================================

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: { redirectTo?: string }
) {
  return function WithAuthComponent(props: P) {
    const { user, loading } = useAuth()
    const router = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null

    useEffect(() => {
      if (!loading && !user && router && options?.redirectTo) {
        router.push(options.redirectTo)
      }
    }, [loading, user, router])

    if (loading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )
    }

    if (!user) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}
