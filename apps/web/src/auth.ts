import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : [
          Google({
            clientId: "dummy-client-id",
            clientSecret: "dummy-client-secret",
          }),
        ]),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        // 1. Akun demo bawaan (dapat langsung masuk tanpa dependensi database lokal)
        if (
          email === "admin@cekloker.id" &&
          (password === "admin123" || password === "admincekloker")
        ) {
          return {
            id: "admin-demo-01",
            name: "Administrator CekLoker",
            email: "admin@cekloker.id",
            role: "ADMIN",
          };
        }

        if (
          email === "user@cekloker.id" &&
          (password === "user12345" || password === "password123")
        ) {
          return {
            id: "user-demo-01",
            name: "Pengguna Demo",
            email: "user@cekloker.id",
            role: "USER",
          };
        }

        // 2. Autentikasi melalui database PostgreSQL via Prisma
        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (user && user.password) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
              return {
                id: user.id,
                name: user.name || "Administrator",
                email: user.email,
                image: user.image,
                role: user.role || (user.email?.startsWith("admin@") ? "ADMIN" : "USER"),
              };
            }
          }
        } catch (dbErr) {
          console.warn("DB authorize error, using fallback credentials:", dbErr);
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role || (user.email?.startsWith("admin@") ? "ADMIN" : "USER");
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "USER";
      }
      return session;
    },
  },
});

