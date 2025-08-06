import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import type { UserStats } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get current date for calculations
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

    // Get total users
    const totalUsers = await prisma.user.count()

    // Get gender statistics
    const genderStats = await prisma.user.groupBy({
      by: ['gender'],
      _count: {
        gender: true
      },
      where: {
        gender: {
          not: null
        }
      }
    })

    // Get age groups
    const usersWithAge = await prisma.user.findMany({
      where: {
        age: {
          not: null
        }
      },
      select: {
        age: true
      }
    })

    // Calculate age groups
    const ageGroups: Record<string, number> = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56-65': 0,
      '65+': 0
    }

    usersWithAge.forEach(user => {
      const age = user.age!
      if (age >= 18 && age <= 25) ageGroups['18-25']++
      else if (age >= 26 && age <= 35) ageGroups['26-35']++
      else if (age >= 36 && age <= 45) ageGroups['36-45']++
      else if (age >= 46 && age <= 55) ageGroups['46-55']++
      else if (age >= 56 && age <= 65) ageGroups['56-65']++
      else if (age > 65) ageGroups['65+']++
    })

    // Get monthly registrations for the last 12 months
    const monthlyRegistrations: Record<string, number> = {}
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const monthKey = `${year}-${String(month).padStart(2, '0')}`
      
      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1)
          }
        }
      })
      
      console.log(`Month ${monthKey}: Found ${count} users`)
      monthlyRegistrations[monthKey] = count
    }

    // Get provider statistics
    const providerStats = await prisma.user.groupBy({
      by: ['provider'],
      _count: {
        provider: true
      }
    })

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentRegistrations = await prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })

    // Get users with profile pictures
    const usersWithPhotos = await prisma.user.count({
      where: {
        image: {
          not: null
        }
      }
    })

    // Get users with complete profiles (name, age, gender, image)
    const usersWithCompleteProfiles = await prisma.user.count({
      where: {
        name: {
          not: null
        },
        age: {
          not: null
        },
        gender: {
          not: null
        },
        image: {
          not: null
        }
      }
    })

    // Calculate profile completion percentage
    const profileCompletionPercentage = totalUsers > 0 
      ? Math.round((usersWithCompleteProfiles / totalUsers) * 100)
      : 0

    // Format gender stats for the frontend
    const formattedGenderStats = genderStats.map(stat => ({
      gender: stat.gender || 'unknown',
      count: stat._count.gender
    }))

    // Add missing genders with 0 count
    const allGenders = ['male', 'female', 'other', 'prefer-not-to-say']
    allGenders.forEach(gender => {
      if (!formattedGenderStats.find(stat => stat.gender === gender)) {
        formattedGenderStats.push({ gender, count: 0 })
      }
    })

    const stats: UserStats = {
      totalUsers,
      genderStats: formattedGenderStats,
      ageGroups,
      monthlyRegistrations,
      providerStats: providerStats.map(stat => ({
        provider: stat.provider,
        count: stat._count.provider
      })),
      recentRegistrations,
      usersWithPhotos,
      usersWithCompleteProfiles,
      profileCompletionPercentage,
      thisMonthRegistrations: monthlyRegistrations[currentMonthKey] || 0
    }

    return NextResponse.json({
      success: true,
      data: stats
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard statistics' },
      { status: 500 }
    )
  }
} 