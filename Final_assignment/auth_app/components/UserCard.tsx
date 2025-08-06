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
      transition={{ delay: index * 0.05 }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      whileTap={{ scale: 0.98 }}
      className="group bg-white rounded-xl border border-gray-200 p-4 transition-all duration-300 hover:border-blue-400 hover:shadow-xl cursor-pointer relative overflow-hidden min-h-[200px] max-h-[200px] flex flex-col"
    >
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <Link href={`/users/${user.id}`} className="relative z-10">
        <div className="flex items-start gap-4">
          {/* Avatar - Top Left */}
          <div className="flex-shrink-0">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || 'User'}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg group-hover:shadow-xl transition-shadow duration-300"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                {user.name ? getInitials(user.name) : <User className="w-6 h-6" />}
              </div>
            )}
          </div>

          {/* User Info - Right Side */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate mb-1 group-hover:text-blue-600 transition-colors duration-200">
              {user.name || 'No name'}
            </h3>
            <p className="text-gray-600 truncate text-sm mb-3 group-hover:text-gray-700 transition-colors duration-200">
              {user.email}
            </p>
            
            {/* User Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-1 text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {user.age && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium shadow-sm">
                    Age: {user.age}
                  </span>
                )}
                
                {user.gender && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium shadow-sm">
                    {capitalizeFirst(user.gender)}
                  </span>
                )}
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium shadow-sm ${
                  user.role === 'ADMIN' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>

            {/* Provider Badge */}
            <div className="flex justify-start">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm transition-all duration-200 group-hover:scale-105 ${
                user.provider === 'github'
                  ? 'bg-gray-100 text-gray-800 group-hover:bg-gray-200'
                  : user.provider === 'google'
                  ? 'bg-red-100 text-red-800 group-hover:bg-red-200'
                  : 'bg-blue-100 text-blue-800 group-hover:bg-blue-200'
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
