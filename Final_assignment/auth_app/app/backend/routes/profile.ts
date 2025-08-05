import express from "express"
import type { Request, Response, NextFunction } from "express"
import { prisma } from "@/lib/prisma"
import { uploadImage, deleteImage } from "@/lib/cloudinary"
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validators"
import { expressWithAuth } from "@/lib/middleware"
import { generalRateLimit, csrfProtection, sanitizeInputs } from "../middleware/security"
import bcrypt from "bcryptjs"
import { PasswordSecurity } from "@/lib/security"
import multer from "multer"
import streamifier from "streamifier"


export const runtime = "nodejs"

const router = express.Router()

// Apply security middlewares
router.use(generalRateLimit)

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed."))
    }
  },
})

// Multer error handler middleware
function multerErrorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError || (err instanceof Error && err.message?.includes("image files"))) {
    return res.status(400).json({ success: false, error: err instanceof Error ? err.message : "File upload error." })
  }
  next(err)
}

// Update user profile
router.put(
  "/",
  expressWithAuth,         
  upload.single("image"),   
  multerErrorHandler,       
  csrfProtection,           
  sanitizeInputs,          
  async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    try {
      const user = req.user as { id: string } | undefined
      if (!user || !user.id) {
        return res.status(401).json({ success: false, error: "Unauthorized" })
      }

      const updateData: Partial<ProfileUpdateInput> & { image?: string } = {}
      if (req.body.name) updateData.name = req.body.name
      if (req.body.gender) updateData.gender = req.body.gender
      if (req.body.age) {
        const ageNum = Number(req.body.age)
        if (Number.isNaN(ageNum)) {
          return res.status(400).json({ success: false, error: "Invalid age" })
        }
        updateData.age = ageNum
      }

      const oldUser = await prisma.user.findUnique({ where: { id: user.id }, select: { image: true } })

      // Inside your route handler, after multerErrorHandler:
if (req.file) {
  // Narrow the type so TS knows `file` is defined
  const file = req.file

  // Streamify the buffer and upload via Cloudinary upload_stream
  const streamUpload = (): Promise<string> =>
    new Promise((resolve, reject) => {
      const cldUploadStream = (require('cloudinary').v2.uploader).upload_stream(
        {
          folder: 'profile-images',
          transformation: {
            width: 400,
            height: 400,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto',
            format: 'webp',
          },
        },
        (error: any, result: any) => {
          if (error) return reject(error)
          resolve(result.secure_url)
        }
      )
      streamifier.createReadStream(file.buffer).pipe(cldUploadStream)
    })

  try {
    // Perform the upload and set the new image URL
    updateData.image = await streamUpload()
  } catch (uploadError) {
    console.error(`Image upload error [user:${user.id}]:`, uploadError)
    return res.status(400).json({ success: false, error: "Failed to upload image." })
  }

  // Delete old image if it exists
        if (oldUser?.image) {
          const publicId = oldUser.image.split('/').pop()?.split('.')[0]
          if (publicId) {
            deleteImage(publicId).catch(err =>
              console.error(`Failed to delete old image [user:${user.id}, public_id:${publicId}]:`, err)
            )
          }
        }
      }


            // Do not allow unsetting fields, only updating
            const finalUpdateData = Object.fromEntries(
              Object.entries(updateData).filter(([, value]) => value !== undefined)
            );

            if (Object.keys(finalUpdateData).length === 0) {
              return res.status(400).json({ success: false, error: "No update data provided." });
            }

            const validatedData = profileUpdateSchema.parse(finalUpdateData)

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
                providerId: true,
                createdAt: true,
                updatedAt: true,
                failedLoginAttempts: true,
                accountLockedUntil: true,
                lastLogin: true,
                lastFailedLogin: true,
              },
            })
            res.json({ success: true, data: updatedUser, message: "Profile updated successfully" })
          } catch (error: unknown) {
            const userId = req.user?.id || "unknown"
            console.error(`[PROFILE_UPDATE_ERROR] User: ${userId} - `, error)

            if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
              return res.status(400).json({
                success: false,
                error: "Validation failed",
                details: (error as any).errors,
              })
            }

            res.status(500).json({ success: false, error: "An internal server error occurred." })
          }
        }
      )

// Change password endpoint
router.put(
  "/change-password",
  expressWithAuth,
  async (req: Request, res: Response) => {
    try {
      const user = req.user as { id: string } | undefined
      if (!user || !user.id) {
        return res.status(401).json({ success: false, error: "Unauthorized" })
      }

      const { currentPassword, newPassword, confirmPassword } = req.body

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          error: "All password fields are required.",
        })
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: "New passwords do not match.",
        })
      }

      const passwordValidation = PasswordSecurity.validatePasswordStrength(newPassword)
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: "New password does not meet security requirements.",
          details: passwordValidation.errors,
        })
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true },
      })

      if (!currentUser || !currentUser.password) {
        return res.status(400).json({
          success: false,
          error: "Cannot change password for this account (e.g., OAuth users).",
        })
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password)
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: "The current password you entered is incorrect.",
        })
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedNewPassword,
          resetToken: null,
          resetExpires: null,
          failedLoginAttempts: 0,
          accountLockedUntil: null,
        },
      })

      res.json({
        success: true,
        message: "Password changed successfully.",
      })
    } catch (error: unknown) {
      const userId = req.user?.id || "unknown"
      console.error(`[PASSWORD_CHANGE_ERROR] User: ${userId} - `, error)
      res.status(500).json({
        success: false,
        error: "An internal server error occurred while changing the password.",
      })
    }
  }
)

export default router

