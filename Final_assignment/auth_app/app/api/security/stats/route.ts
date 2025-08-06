import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

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

    if (!authResult.user || authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get total security events
    const totalEvents = await prisma.securityLog.count()

    // Get events by type
    const eventTypes = await prisma.securityLog.groupBy({
      by: ['event'],
      _count: {
        event: true
      }
    })

    // Convert to object format
    const eventTypesMap: Record<string, number> = {}
    eventTypes.forEach(type => {
      eventTypesMap[type.event] = type._count.event
    })

    // Get recent events (last 50)
    const recentEvents = await prisma.securityLog.findMany({
      take: 50,
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    // Count suspicious activity (failed logins)
    const suspiciousActivity = await prisma.securityLog.count({
      where: {
        event: 'FAILED_LOGIN',
        success: false
      }
    })

    const stats = {
      totalEvents,
      eventTypes: eventTypesMap,
      recentEvents,
      suspiciousActivity
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Security stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load security statistics' },
      { status: 500 }
    )
  }
}