import { Loader2, Users } from "lucide-react"
import ProtectedLayout from "@/components/ProtectedLayout"

export default function Loading() {
  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div 
          className="flex flex-col items-center justify-center space-y-6"
          role="status"
          aria-live="polite"
          aria-label="Loading users"
        >
          {/* Loading Icon with Animation */}
          <div className="relative">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <div className="absolute -inset-2">
              <Loader2 className="w-20 h-20 text-blue-600 animate-spin opacity-30" aria-hidden="true" />
            </div>
          </div>

          {/* Loading Text */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Loading Users</h2>
            <p className="text-gray-600">Please wait while we fetch user information...</p>
          </div>

          {/* Loading Progress Indicator */}
          <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>

          {/* Accessibility Text for Screen Readers */}
          <span className="sr-only">Loading users, please wait...</span>
        </div>
      </div>
    </ProtectedLayout>
  )
}
