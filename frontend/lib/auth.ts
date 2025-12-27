// Authentication utilities for Supabase Auth

import { createBrowserClient } from './supabase'
import { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email?: string
  phone?: string
  full_name?: string
  business_name?: string
  role: string
}

/**
 * Sign in with email (magic link)
 */
export async function signInWithEmail(email: string, redirectTo?: string) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo || `${window.location.origin}/claim?step=business`,
      shouldCreateUser: true,
    },
  })

  if (error) throw error
  return data
}

/**
 * Sign in with phone (SMS)
 */
export async function signInWithPhone(phone: string) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: true,
    },
  })

  if (error) throw error
  return data
}

/**
 * Verify phone OTP
 */
export async function verifyPhoneOTP(phone: string, token: string) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })

  if (error) throw error
  return data
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Get current user profile (with extended user data)
 */
export async function getCurrentUserProfile(): Promise<AuthUser | null> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Fetch user profile from users table
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Profile doesn't exist yet, return basic user info
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: 'merchant',
    }
  }

  return {
    id: profile.id,
    email: profile.email || user.email,
    phone: profile.phone || user.phone,
    full_name: profile.full_name,
    business_name: profile.business_name,
    role: profile.role || 'merchant',
  }
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: Partial<AuthUser>) {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      phone: user.phone,
      ...updates,
    }, {
      onConflict: 'id',
    })

  if (error) throw error
  return data
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Wait for auth state change
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const supabase = createBrowserClient()
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null)
  })
}

