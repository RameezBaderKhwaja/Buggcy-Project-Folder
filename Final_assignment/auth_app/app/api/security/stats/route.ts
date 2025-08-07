import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {

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

    // Fetch total security events count from database
    const totalEvents = await prisma.securityLog.count()

    const eventTypes = await prisma.securityLog.groupBy({
      by: ['event'],
      _count: {
        event: true
      }
    })

    // Convert aggregated event types to object format for frontend
    const eventTypesMap: Record<string, number> = {}
    eventTypes.forEach(type => {
      eventTypesMap[type.event] = type._count.event
    })

    // Fetch recent security events for monitoring dashboard
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

    // Count suspicious activity (failed login attempts)
    const suspiciousActivity = await prisma.securityLog.count({
      where: {
        event: 'FAILED_LOGIN',
        success: false
      }
    })

    // Compile security statistics for response
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