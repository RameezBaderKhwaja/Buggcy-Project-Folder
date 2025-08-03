'use client'

import { motion } from 'framer-motion'
import { User, Calendar, MapPin } from 'lucide-react'
import { AuthUser } from '@/lib/types'
import { formatDate, getInitials, capitalizeFirst } from '@/lib/utils'
import Link from 'next/link'

interface UserCardProps {
  user: AuthUser
  index: number
}

export function UserCard({ user, index }: UserCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300 hover:scale-[1.02]"
    >
      <Link href={`/users/${user.id}`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || 'User'}
                className="w-20 h-20 sm:w-16 sm:h-16 rounded-full object-cover border-3 border-gray-200 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                {user.name ? getInitials(user.name) : <User className="w-10 h-10 sm:w-8 sm:h-8" />}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h3 className="text-xl sm:text-lg font-bold text-gray-900 truncate mb-1">
              {user.name || 'No name'}
            </h3>
            <p className="text-gray-600 truncate text-sm mb-3">{user.email}</p>
            
            {/* User Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-center sm:justify-start space-x-1 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                {user.age && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Age: {user.age}
                  </span>
                )}
                
                {user.gender && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {capitalizeFirst(user.gender)}
                  </span>
                )}
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === 'ADMIN' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>

            {/* Provider Badge */}
            <div className="flex justify-center sm:justify-start">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                user.provider === 'github'
                  ? 'bg-gray-100 text-gray-800'
                  : user.provider === 'google'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {capitalizeFirst(user.provider)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
