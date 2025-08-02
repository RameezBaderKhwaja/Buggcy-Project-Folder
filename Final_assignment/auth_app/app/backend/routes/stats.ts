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

      // Get gender statistics (normalize to lowercase)
      const genderStats = await prisma.user.groupBy({
        by: ["gender"],
        _count: { gender: true },
        where: { gender: { not: null } },
      })
      const formattedGenderStats = genderStats.map((stat) => ({
        gender: stat.gender ? stat.gender.toLowerCase() : "unknown",
        count: stat._count.gender,
      }))

      // Get age group statistics
      const users = await prisma.user.findMany({
        select: { age: true },
        where: { age: { not: null } },
      })
      const ageGroups: Record<string, number> = {
        "18-25": 0,
        "26-35": 0,
        "36-45": 0,
        "46+": 0,
      }
      users.forEach((user) => {
        if (user.age) {
          if (user.age >= 18 && user.age <= 25) ageGroups["18-25"]++
          else if (user.age >= 26 && user.age <= 35) ageGroups["26-35"]++
          else if (user.age >= 36 && user.age <= 45) ageGroups["36-45"]++
          else if (user.age >= 46) ageGroups["46+"]++
        }
      })

      // Get monthly registrations (last 12 months) - DB-level aggregation
      const last12Months = getLast12Months()
      // Use raw query for efficient aggregation (Postgres example)
      const rawMonthly = await prisma.$queryRawUnsafe<any[]>(
        `SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*) as count
         FROM "User"
         WHERE "createdAt" >= date_trunc('month', now()) - interval '11 months'
         GROUP BY month
         ORDER BY month ASC`
      )
      const monthlyStats: Record<string, number> = {}
      last12Months.forEach((month) => {
        const found = rawMonthly.find((row) => row.month === month)
        monthlyStats[month] = found ? Number(found.count) : 0
      })

      res.setHeader("Cache-Control", "no-store")
      res.json({
        success: true,
        data: {
          totalUsers,
          genderStats: formattedGenderStats,
          ageGroups,
          monthlyRegistrations: monthlyStats,
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
