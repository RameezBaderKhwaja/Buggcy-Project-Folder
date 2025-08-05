// app/backend/routes/stats.ts
import express from "express"
import { prisma } from "@/lib/prisma"
import { expressWithAdminAuth } from "@/lib/middleware"
import { strictRateLimit } from "../middleware/security"

const router = express.Router()

// Helper: get last 12 months as YYYY-MM
function getLast12Months(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d.toISOString().substring(0, 7))
  }
  return months
}

// Get dashboard statistics
router.get(
  "/dashboard",
  strictRateLimit, // Rate limit for admin stats
  expressWithAdminAuth,
  async (req, res) => {
    try {
      // Get total users
      const totalUsers = await prisma.user.count()

      // Get gender statistics with proper handling
      const genderStatsRaw = await prisma.user.groupBy({
        by: ["gender"],
        _count: { gender: true },
      })
      
      const genderStats = genderStatsRaw.map((stat) => ({
        gender: stat.gender ? stat.gender.toLowerCase() : "not-specified",
        count: stat._count.gender,
      }))

      // Get age group statistics with better logic
      const usersWithAge = await prisma.user.findMany({
        select: { age: true },
        where: { age: { not: null } },
      })
      
      const ageGroups: Record<string, number> = {
        "13-17": 0,
        "18-25": 0,
        "26-35": 0,
        "36-45": 0,
        "46-60": 0,
        "60+": 0,
      }
      
      usersWithAge.forEach((user) => {
        if (user.age) {
          if (user.age >= 13 && user.age <= 17) ageGroups["13-17"]++
          else if (user.age >= 18 && user.age <= 25) ageGroups["18-25"]++
          else if (user.age >= 26 && user.age <= 35) ageGroups["26-35"]++
          else if (user.age >= 36 && user.age <= 45) ageGroups["36-45"]++
          else if (user.age >= 46 && user.age <= 60) ageGroups["46-60"]++
          else if (user.age > 60) ageGroups["60+"]++
        }
      })

      // Get monthly registrations with improved logic
      const last12Months = getLast12Months()
      const startDate = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
      
      const monthlyRegistrationsData = await prisma.user.findMany({
        select: {
          createdAt: true,
        },
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: {
          createdAt: 'asc'
        }
      })
      
      // Initialize all months with 0
      const monthlyRegistrations: Record<string, number> = {}
      last12Months.forEach((month) => {
        monthlyRegistrations[month] = 0
      })
      
      // Count registrations per month
      monthlyRegistrationsData.forEach((user) => {
        const month = user.createdAt.toISOString().substring(0, 7)
        if (monthlyRegistrations.hasOwnProperty(month)) {
          monthlyRegistrations[month]++
        }
      })
      
      // Get current month registrations for "This Month" card
      const currentMonth = new Date().toISOString().substring(0, 7)
      const currentMonthCount = monthlyRegistrations[currentMonth] || 0

      res.setHeader("Cache-Control", "no-store")
      res.json({
        success: true,
        data: {
          totalUsers,
          genderStats,
          ageGroups,
          monthlyRegistrations,
          currentMonthRegistrations: currentMonthCount,
        },
      })
    } catch (error: unknown) {
      const adminId = req.user?.id || "unknown"
      console.error(`[Dashboard][Admin:${adminId}] Stats error:`, error)
      res.status(500).json({ success: false, error: "Internal server error" })
    }
  }
)

export default router
