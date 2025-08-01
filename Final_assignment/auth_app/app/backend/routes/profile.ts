import express from "express"
import multer from "multer"
import { prisma } from "@/lib/prisma"
import { uploadImage } from "@/lib/cloudinary"
import { verifyToken } from "@/lib/auth"
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validators"
import { expressWithAuth } from "@/lib/middleware"

const router = express.Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"))
    }
  },
})

// Update user profile
router.put("/", expressWithAuth, upload.single("image"), async (req, res) => {
  try {
    const user = (req as express.Request & { user: { id: string } }).user

    // Parse form data
    const updateData: Partial<ProfileUpdateInput> = {}

    if (req.body.name) updateData.name = req.body.name
    if (req.body.age) updateData.age = parseInt(req.body.age)
    if (req.body.gender) updateData.gender = req.body.gender

    // Handle image upload
    if (req.file) {
      try {
        const imageUrl = await uploadImage(req.file.buffer, "profile-images")
        updateData.image = imageUrl
      } catch (uploadError) {
        console.error("Image upload error:", uploadError)
        return res.status(400).json({
          success: false,
          error: "Failed to upload image",
        })
      }
    }

    // Validate data
    const validatedData = profileUpdateSchema.parse(updateData)

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: validatedData,
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
        updatedAt: true,
      },
    })

    res.json({
      success: true,
      data: updatedUser,
      message: "Profile updated successfully",
    })
  } catch (error: unknown) {
    console.error("Profile update error:", error)

    if (error && typeof error === 'object' && 'errors' in error) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: (error as { errors: unknown }).errors,
      })
    }

    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

export default router
