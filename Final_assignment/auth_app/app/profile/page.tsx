'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import ProtectedLayout from '@/components/ProtectedLayout'
import { motion } from 'framer-motion'
import { User, Camera, Save, Loader2, AlertCircle } from 'lucide-react'

// Form validation
interface FormErrors {
  name?: string
  age?: string
  gender?: string
}

export default function ProfilePage() {
  const { user, updateProfile, csrfToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  
  // Refs for cleanup
  const isMountedRef = useRef(true)
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age?.toString() || '',
    gender: user?.gender || ''
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(user?.image || '')

  // Sync formData when user changes (e.g., from another tab)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age?.toString() || '',
        gender: user.gender || ''
      })
      setImagePreview(user.image || '')
    }
  }, [user])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
    }
  }, [])

  // Early return for missing user
  if (!user) {
    return (
      <ProtectedLayout>
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {}
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }
    
    // Age validation
    if (formData.age) {
      const ageNum = Number(formData.age)
      if (isNaN(ageNum)) {
        errors.age = 'Age must be a valid number'
      } else if (ageNum < 13) {
        errors.age = 'Age must be at least 13'
      } else if (ageNum > 120) {
        errors.age = 'Age must be less than 120'
      }
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear field-specific error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }, [formErrors])

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB')
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      
      setImageFile(file)
      
      // Create FileReader with proper cleanup
      const reader = new FileReader()
      reader.onloadend = () => {
        if (isMountedRef.current) {
          setImagePreview(reader.result as string)
        }
      }
      reader.onerror = () => {
        if (isMountedRef.current) {
          setError('Failed to read image file')
        }
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submission
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name.trim())
      formDataToSend.append('age', formData.age)
      formDataToSend.append('gender', formData.gender)
      
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      }

      // Use CSRF token from context
      if (!csrfToken) {
        setError('CSRF token not available. Please refresh the page and try again.')
        return
      }

      const result = await updateProfile(formDataToSend)
      
      // Check if component is still mounted
      if (!isMountedRef.current) return
      
      if (result.success) {
        setSuccess(true)
        setError('') // Clear any previous errors
        setImageFile(null)
        
        // Set timeout with cleanup
        successTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setSuccess(false)
          }
        }, 3000)
      } else {
        setError(result.error || 'Failed to update profile')
        setSuccess(false) // Clear success state
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('An error occurred while updating profile')
        setSuccess(false)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [formData, imageFile, updateProfile, validateForm])

  return (
    <ProtectedLayout>
      <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your personal information and preferences</p>
        </motion.div>

        <div className="max-w-2xl">
          {/* Messages - Only show one at a time */}
          <div className="space-y-4 mb-6">
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
                role="alert"
                aria-live="polite"
                id="success-message"
              >
                Profile updated successfully!
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start space-x-2"
                role="alert"
                aria-live="polite"
                id="error-message"
              >
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </motion.div>
            )}
          </div>

          {/* Profile Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-8"
          >
            <form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              aria-describedby={error ? "error-message" : success ? "success-message" : undefined}
              noValidate
            >
              {/* Profile Image */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={`Profile photo of ${user.name || 'user'}`}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="w-8 h-8 text-gray-400" aria-hidden="true" />
                    </div>
                  )}
                  
                  <label
                    htmlFor="image-upload"
                    className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                    aria-label="Upload profile image"
                  >
                    <Camera className="w-4 h-4" aria-hidden="true" />
                  </label>
                  
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    aria-label="Upload profile image"
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Profile Photo</h3>
                  {!imagePreview && (
                    <p className="text-sm text-gray-600">
                      Click the camera icon to upload a new photo (max 5MB)
                    </p>
                  )}
                  {imagePreview && imageFile && (
                    <p className="text-sm text-green-600">
                      New photo selected - click Save to update
                    </p>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      formErrors.name 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                    aria-invalid={!!formErrors.name}
                    aria-describedby={formErrors.name ? "name-error" : undefined}
                  />
                  {formErrors.name && (
                    <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    aria-describedby="email-help"
                  />
                  <p id="email-help" className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="13"
                    max="120"
                    value={formData.age}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      formErrors.age 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter your age"
                    aria-invalid={!!formErrors.age}
                    aria-describedby={formErrors.age ? "age-error" : "age-help"}
                  />
                  {formErrors.age ? (
                    <p id="age-error" className="mt-1 text-sm text-red-600" role="alert">
                      {formErrors.age}
                    </p>
                  ) : (
                    <p id="age-help" className="text-xs text-gray-500 mt-1">Optional (13-120 years)</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    aria-describedby="gender-help"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                  <p id="gender-help" className="text-xs text-gray-500 mt-1">Optional</p>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-busy={loading}
                aria-describedby={loading ? "loading-text" : undefined}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    <span id="loading-text">Updating Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" aria-hidden="true" />
                    <span>Save Changes</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
