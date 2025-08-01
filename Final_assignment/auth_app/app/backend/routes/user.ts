import express from "express"
import { prisma } from "@/lib/prisma"

const router = express.Router()

// Get all users (admin only)
router.get("/", async (req, res) => {
  try {
    const token = req.cookies["auth-token"]

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - No token provided",
      })
    }

    // For now, allow all authenticated users to see user list
    // In production, you might want to restrict this to admins only
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        age: true,
        gender: true,
        provider: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        age: true,
        gender: true,
        provider: true,
        createdAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      })
    }

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

export default router
