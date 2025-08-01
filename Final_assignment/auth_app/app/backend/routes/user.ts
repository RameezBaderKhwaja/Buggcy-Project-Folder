import express from "express"
import { prisma } from "@/lib/prisma"
import { expressWithAuth, expressWithAdminAuth } from "@/lib/middleware"

const router = express.Router()

// Get all users (admin only)
router.get("/", expressWithAdminAuth, async (req, res) => {
  try {
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
router.get("/:id", expressWithAuth, async (req, res) => {
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
