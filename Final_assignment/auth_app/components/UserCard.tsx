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
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300"
    >
      <Link href={`/users/${user.id}`}>
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || 'User'}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {user.name ? getInitials(user.name) : <User className="w-8 h-8" />}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {user.name || 'No name'}
            </h3>
            <p className="text-gray-600 truncate">{user.email}</p>
            
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
              
              {user.age && (
                <span>Age: {user.age}</span>
              )}
              
              {user.gender && (
                <span>{capitalizeFirst(user.gender)}</span>
              )}
            </div>
          </div>

          {/* Provider Badge */}
          <div className="flex-shrink-0">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                user.provider === 'github'
                  ? 'bg-gray-100 text-gray-800'
                  : user.provider === 'google'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {capitalizeFirst(user.provider)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
