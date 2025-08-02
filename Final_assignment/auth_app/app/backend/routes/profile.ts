import express from "express"
import multer from "multer"
import type { Request, Response, NextFunction } from "express"
import { prisma } from "@/lib/prisma"
import { uploadImage, deleteImage } from "@/lib/cloudinary"
import { verifyToken } from "@/lib/auth"
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validators"
import { expressWithAuth } from "@/lib/middleware"
import { generalRateLimit, csrfProtection, sanitizeInputs } from "../middleware/security"

const router = express.Router()

// Apply security middlewares
router.use(generalRateLimit, csrfProtection, sanitizeInputs)

// Configure multer for file uploads (memory storage, document risk)
const upload = multer({
  storage: multer.memoryStorage(), // NOTE: For large/production, use disk or stream upload
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true)
    else cb(new Error("Only image files are allowed"))
  },
})

// Multer error handler middleware
function multerErrorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError || (err instanceof Error && err.message?.includes("image files"))) {
    return res.status(400).json({ success: false, error: err instanceof Error ? err.message : "File upload error" })
  }
  next(err)
}

// Update user profile
router.put(
  "/",
  expressWithAuth,
  upload.single("image"),
  multerErrorHandler,
  async (req: Request, res: Response) => {
    try {
      const user = req.user as { id: string } | undefined;
      if (!user || !user.id) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }
      // Parse form data
      const updateData: Partial<ProfileUpdateInput> = {}
      if (req.body.name) updateData.name = req.body.name
      if (req.body.gender) updateData.gender = req.body.gender
      if (req.body.age) {
        const ageNum = Number(req.body.age)
        if (Number.isNaN(ageNum)) {
          return res.status(400).json({ success: false, error: "Invalid age" })
        }
        updateData.age = ageNum
      }
      // Handle image upload and old image cleanup
      if (req.file) {
        try {
          // Fetch old image URL
          const oldUser = await prisma.user.findUnique({ where: { id: user.id }, select: { image: true } })
          if (oldUser?.image) {
            // Extract public_id from URL for Cloudinary deletion
            const match = oldUser.image.match(/\/([^\/]+)\.[a-zA-Z]+$/)
            if (match) {
              const publicId = match[1]
              deleteImage(publicId).catch(() => {}) // fire-and-forget
            }
          }
          const result = await uploadImage(req.file.buffer, "profile-images")
          updateData.image = result.secure_url
        } catch (uploadError) {
          console.error(`Image upload error [user:${user.id}]:`, uploadError)
          return res.status(400).json({ success: false, error: "Failed to upload image" })
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
      res.json({ success: true, data: updatedUser, message: "Profile updated successfully" })
    } catch (error: unknown) {
      console.error(`Profile update error [user:${req?.user?.id}]:`, error)
      if (error && typeof error === 'object' && 'errors' in error) {
        return res.status(400).json({ success: false, error: "Validation failed", details: (error as { errors: unknown }).errors })
      }
      res.status(500).json({ success: false, error: "Internal server error" })
    }
  }
)

export default router
