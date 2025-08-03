import express from "express"
import multer from "multer"
import type { Request, Response, NextFunction } from "express"
import { prisma } from "@/lib/prisma"
import { uploadImage, deleteImage } from "@/lib/cloudinary"
import { verifyToken } from "@/lib/auth"
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validators"
import { expressWithAuth } from "@/lib/middleware"
import { generalRateLimit, csrfProtection, sanitizeInputs } from "../middleware/security"
import bcrypt from "bcryptjs"
import { PasswordSecurity } from "@/lib/security"

export const runtime = "nodejs"

const router = express.Router()

// Apply security middlewares
router.use(generalRateLimit, csrfProtection, sanitizeInputs)
router.use(generalRateLimit, sanitizeInputs)

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
          // Convert buffer to base64 data URL for Cloudinary
          const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
          const result = await uploadImage(base64Data, "profile-images")
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
      const userId = req.user?.id || 'unknown';
      console.error(`[PROFILE_UPDATE_ERROR] User: ${userId} - `, error);

      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        return res.status(400).json({ 
          success: false, 
          error: "Validation failed", 
          details: (error as any).errors 
        });
      }
      
      res.status(500).json({ success: false, error: "An internal server error occurred while updating the profile." })
    }
  }
)

// Change password endpoint
router.put(
  "/change-password",
  expressWithAuth,
  async (req: Request, res: Response) => {
    try {
      const user = req.user as { id: string } | undefined;
      if (!user || !user.id) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          error: "All fields are required" 
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          error: "New passwords do not match" 
        });
      }

      // Validate new password strength
      const passwordValidation = PasswordSecurity.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: "New password does not meet security requirements",
          details: passwordValidation.errors,
        });
      }

      // Get current user with password
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, password: true, email: true }
      });

      if (!currentUser || !currentUser.password) {
        return res.status(400).json({ 
          success: false, 
          error: "Cannot change password for OAuth users" 
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ 
          success: false, 
          error: "Current password is incorrect" 
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password in database
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashedNewPassword,
          // Clear any existing reset tokens
          resetToken: null,
          resetExpires: null,
          // Reset failed login attempts
          failedLoginAttempts: 0,
          accountLockedUntil: null,
        },
      });

      res.json({ 
        success: true, 
        message: "Password changed successfully" 
      });
    } catch (error: unknown) {
      const userId = req.user?.id || 'unknown';
      console.error(`[PASSWORD_CHANGE_ERROR] User: ${userId} - `, error);
      res.status(500).json({ 
        success: false, 
        error: "An internal server error occurred while changing password." 
      });
    }
  }
)

export default router
