"use client"

import { useState, useEffect } from "react"

interface PasswordStrength {
  score: number
  feedback: string[]
  isValid: boolean
}

export function usePasswordStrength(password: string) {
  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false,
  })

  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, feedback: [], isValid: false })
      return
    }

    const feedback: string[] = []
    let score = 0

    // Length check
    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push("Password must be at least 8 characters long")
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push("Add uppercase letters")
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      feedback.push("Add lowercase letters")
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1
    } else {
      feedback.push("Add numbers")
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1
    } else {
      feedback.push("Add special characters")
    }

    // Common password check
    const commonPasswords = ["password", "123456", "qwerty", "admin", "letmein"]
    if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
      score = Math.max(0, score - 2)
      feedback.push("Avoid common passwords")
    }

    setStrength({
      score,
      feedback,
      isValid: score >= 4 && password.length >= 8,
    })
  }, [password])

  return strength
}
