import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import path from "path";
import dotenv from "dotenv";

// Explicitly load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log("DEBUG: Env Vars Check:", {
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    clientIdLength: process.env.GOOGLE_CLIENT_ID?.length,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    projectId: process.env.GOOGLE_CLOUD_PROJECT
});

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
