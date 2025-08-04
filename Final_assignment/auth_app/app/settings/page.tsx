'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/AuthContext"
import ProtectedLayout from '@/components/ProtectedLayout'
import { motion } from 'framer-motion'
import { Bell, Shield, Palette, Globe, Save, Loader2, Check, AlertCircle, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'


// Types for settings
interface UserSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
}

// Available languages with proper labels
const LANGUAGES = [
  { value: 'en', label: 'English', nativeName: 'English' },
  { value: 'es', label: 'Spanish', nativeName: 'Español' },
  { value: 'fr', label: 'French', nativeName: 'Français' },
  { value: 'de', label: 'German', nativeName: 'Deutsch' },
  { value: 'pt', label: 'Portuguese', nativeName: 'Português' },
  { value: 'it', label: 'Italian', nativeName: 'Italiano' },
  { value: 'ja', label: 'Japanese', nativeName: '日本語' },
  { value: 'ko', label: 'Korean', nativeName: '한국어' },
  { value: 'zh', label: 'Chinese', nativeName: '中文' },
]

// Get available timezones
const getTimezones = () => {
  try {
    return Intl.supportedValuesOf('timeZone').map(tz => ({
      value: tz,
      label: tz.replace(/_/g, ' '),
      offset: new Intl.DateTimeFormat('en', {
        timeZone: tz,
        timeZoneName: 'short'
      }).formatToParts(new Date()).find(part => part.type === 'timeZoneName')?.value || ''
    })).slice(0, 50) // Limit to first 50 for performance
  } catch {
    // Fallback for older browsers
    return [
      { value: 'UTC', label: 'UTC', offset: 'UTC' },
      { value: 'America/New_York', label: 'Eastern Time', offset: 'EST' },
      { value: 'America/Chicago', label: 'Central Time', offset: 'CST' },
      { value: 'America/Denver', label: 'Mountain Time', offset: 'MST' },
      { value: 'America/Los_Angeles', label: 'Pacific Time', offset: 'PST' },
      { value: 'Europe/London', label: 'London', offset: 'GMT' },
      { value: 'Europe/Paris', label: 'Paris', offset: 'CET' },
      { value: 'Asia/Tokyo', label: 'Tokyo', offset: 'JST' },
    ]
  }
}

const TIMEZONES = getTimezones()

// Custom Switch Component
const Switch = ({ 
  id, 
  checked, 
  onCheckedChange, 
  ...props 
}: {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  [key: string]: any
}) => (
  <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
    <input
      id={id}
      type="checkbox"
      className="sr-only peer"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      {...props}
    />
    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
  </label>
)

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    pushNotifications: false,
    theme: 'system',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  })

  // Track initial settings to detect changes
  const [initialSettings, setInitialSettings] = useState<UserSettings>(settings)

  // Ensure component is mounted (for theme)
  useEffect(() => {
    setMounted(true)
    loadSettings()
  }, [])

  // Detect changes
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(initialSettings)
    setHasChanges(changed)
  }, [settings, initialSettings])

  // Load settings from localStorage or API
  const loadSettings = useCallback(async () => {
    try {
      // Try to load from localStorage first
      const savedSettings = localStorage.getItem('userSettings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
        setInitialSettings(parsed)
        
        // Apply theme if different from current
        if (parsed.theme !== theme) {
          setTheme(parsed.theme)
        }
      }
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/user/settings')
      // const data = await response.json()
      // setSettings(data)
      // setInitialSettings(data)
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load settings')
    }
  }, [theme, setTheme])

  // Update individual setting
  const updateSetting = useCallback(<K extends keyof UserSettings>(
    key: K, 
    value: UserSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    
    // Apply theme immediately
    if (key === 'theme') {
      setTheme(value as string)
    }
  }, [setTheme])

  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = React.useCallback(async () => {
    try {
      await logout()
      router.push("/login")
    } catch (err) {
      console.error("Logout failed:", err)
      toast.error("Failed to log out — try again")
    }
  }, [logout, router])


  // Save settings
  const handleSave = useCallback(async () => {
    if (!hasChanges) return
    
    setLoading(true)
    try {
      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings))
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/user/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // })
      // 
      // if (!response.ok) throw new Error('Failed to save settings')
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setInitialSettings(settings)
      setHasChanges(false)
      toast.success('Settings saved successfully!')
      
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [settings, hasChanges])

  // Don't render until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <ProtectedLayout>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ProtectedLayout>
    )
  }
  return (
    <ProtectedLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
              <p className="text-gray-600">Manage your account preferences and settings</p>
            </div>
            {hasChanges && (
              <div className="flex items-center space-x-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">You have unsaved changes</span>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-4xl space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-blue-600" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label 
                    htmlFor="email-notifications"
                    className="text-base font-medium"
                  >
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your account activity
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  aria-describedby="email-notifications-description"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label 
                    htmlFor="push-notifications"
                    className="text-base font-medium"
                  >
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in your browser
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                  aria-describedby="push-notifications-description"
                />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Security</span>
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={() => router.push('/settings/change-password')}
              >
                <div className="text-left">
                  <h4 className="font-medium">Change Password</h4>
                  <p className="text-sm text-muted-foreground">Update your account password</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={() => {/* TODO: Navigate to 2FA setup */}}
              >
                <div className="text-left">
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={() => {/* TODO: Navigate to login history */}}
              >
                <div className="text-left">
                  <h4 className="font-medium">Login History</h4>
                  <p className="text-sm text-muted-foreground">View your recent login activity</p>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Palette className="w-5 h-5 text-purple-600" />
                <span>Appearance</span>
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium mb-3 block">Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['light', 'dark', 'system'] as const).map((themeOption) => (
                      <label
                        key={themeOption}
                        className={`
                          flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all
                          ${settings.theme === themeOption 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="theme"
                          value={themeOption}
                          checked={settings.theme === themeOption}
                          onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark' | 'system')}
                          className="sr-only"
                          aria-describedby={`theme-${themeOption}-description`}
                        />
                        <span className="capitalize font-medium">
                          {themeOption}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language & Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-orange-600" />
                <span>Language & Region</span>
              </CardTitle>
              <CardDescription>
                Set your preferred language and timezone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="language-select" className="text-base font-medium">
                  Language
                </Label>
                <select
                  id="language-select"
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value)}
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-describedby="language-description"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label} ({lang.nativeName})
                    </option>
                  ))}
                </select>
                <p id="language-description" className="text-sm text-muted-foreground mt-1">
                  Choose your preferred language for the interface
                </p>
              </div>
              
              <div>
                <Label htmlFor="timezone-select" className="text-base font-medium">
                  Timezone
                </Label>
                <select
                  id="timezone-select"
                  value={settings.timezone}
                  onChange={(e) => updateSetting('timezone', e.target.value)}
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-describedby="timezone-description"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label} ({tz.offset})
                    </option>
                  ))}
                </select>
                <p id="timezone-description" className="text-sm text-muted-foreground mt-1">
                  Select your local timezone for accurate time display
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <LogOut className="w-5 h-5 text-red-600" />
                <span>Account</span>
              </CardTitle>
              <CardDescription>
                Manage your account settings and security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full justify-center h-auto p-4 text-white flex items-center space-x-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Log Out</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || loading}
              size="lg"
              className="min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : hasChanges ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
