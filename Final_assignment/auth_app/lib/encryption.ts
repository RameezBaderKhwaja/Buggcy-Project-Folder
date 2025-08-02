import crypto from "crypto"

export class DataEncryption {
  private static readonly ALGORITHM = "aes-256-gcm"
  private static readonly KEY_LENGTH = 32
  private static readonly IV_LENGTH = 16
  private static readonly TAG_LENGTH = 16

  private static getKey(): Buffer {
    const secret = process.env.ENCRYPTION_KEY || "default-secret-key-change-in-production"
    return crypto.scryptSync(secret, "salt", this.KEY_LENGTH)
  }

  static encrypt(text: string): string {
    try {
      const key = this.getKey()
      const iv = crypto.randomBytes(this.IV_LENGTH)
      const cipher = crypto.createCipher(this.ALGORITHM, key)

      cipher.setAAD(Buffer.from("additional-data"))

      let encrypted = cipher.update(text, "utf8", "hex")
      encrypted += cipher.final("hex")

      const tag = cipher.getAuthTag()

      return iv.toString("hex") + ":" + tag.toString("hex") + ":" + encrypted
    } catch (error: unknown) {
      console.error("Encryption error:", error)
      throw new Error("Failed to encrypt data")
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(":")
      if (parts.length !== 3) {
        throw new Error("Invalid encrypted data format")
      }

      const key = this.getKey()
      const iv = Buffer.from(parts[0], "hex")
      const tag = Buffer.from(parts[1], "hex")
      const encrypted = parts[2]

      const decipher = crypto.createDecipher(this.ALGORITHM, key)
      decipher.setAAD(Buffer.from("additional-data"))
      decipher.setAuthTag(tag)

      let decrypted = decipher.update(encrypted, "hex", "utf8")
      decrypted += decipher.final("utf8")

      return decrypted
    } catch (error: unknown) {
      console.error("Decryption error:", error)
      throw new Error("Failed to decrypt data")
    }
  }

  static hash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex")
  }

  static generateSalt(): string {
    return crypto.randomBytes(16).toString("hex")
  }
}
