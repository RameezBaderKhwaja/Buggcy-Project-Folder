import express from "express"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

const router = express.Router()

// Get dashboard statistics
router.get("/dashboard", async (req, res) => {
  try {
    const token = req.cookies["auth-token"]

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - No token provided",
      })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      })
    }

    // Get total users
    const totalUsers = await prisma.user.count()

    // Get gender statistics
    const genderStats = await prisma.user.groupBy({
      by: ["gender"],
      _count: {
        gender: true,
      },
      where: {
        gender: {
          not: null,
        },
      },
    })

    const formattedGenderStats = genderStats.map((stat) => ({
      gender: stat.gender || "unknown",
      count: stat._count.gender,
    }))

    // Get age group statistics
    const users = await prisma.user.findMany({
      select: { age: true },
      where: {
        age: {
          not: null,
        },
      },
    })

    const ageGroups: Record<string, number> = {
      "18-25": 0,
      "26-35": 0,
      "36-45": 0,
      "46+": 0,
    }

    users.forEach((user) => {
      if (user.age) {
        if (user.age >= 18 && user.age <= 25) {
          ageGroups["18-25"]++
        } else if (user.age >= 26 && user.age <= 35) {
          ageGroups["26-35"]++
        } else if (user.age >= 36 && user.age <= 45) {
          ageGroups["36-45"]++
        } else if (user.age >= 46) {
          ageGroups["46+"]++
        }
      }
    })

    // Get monthly registrations (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const monthlyRegistrations = await prisma.user.findMany({
      select: {
        createdAt: true,
      },
      where: {
        createdAt: {
          gte: twelveMonthsAgo,
        },
      },
    })

    const monthlyStats: Record<string, number> = {}
    monthlyRegistrations.forEach((user) => {
      const monthKey = user.createdAt.toISOString().substring(0, 7) // YYYY-MM format
      monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1
    })

    res.json({
      success: true,
      data: {
        totalUsers,
        genderStats: formattedGenderStats,
        ageGroups,
        monthlyRegistrations: monthlyStats,
      },
    })
  } catch (error) {
    console.error("Stats error:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

export default router
