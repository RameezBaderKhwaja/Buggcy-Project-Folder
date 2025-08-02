import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create admin user with enhanced security
  const hashedPassword = await bcrypt.hash("Admin123!@#", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: hashedPassword,
      role: Role.ADMIN,
      provider: "email",
      age: 30,
      gender: "male",
    },
  })

  // Create sample users with strong passwords
  const users = [
    {
      email: "rameezbader@example.com",
      name: "Rameez Bader",
      password: await bcrypt.hash("User123!@#", 12),
      age: 21,
      gender: "male",
    },
    {
      email: "sana@example.com",
      name: "Sana Gul",
      password: await bcrypt.hash("User456!@#", 12),
      age: 28,
      gender: "female",
    },
    {
      email: "ahmed@example.com",
      name: "Ahmed Ali",
      password: await bcrypt.hash("User789!@#", 12),
      age: 35,
      gender: "male",
    },
  ]

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    })
  }

  console.log("Database seeded successfully!")
  console.log("Admin credentials: admin@example.com / Admin123!@#")
  console.log("User credentials: rameezbader@example.com / User123!@#")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
