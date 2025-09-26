import * as bcrypt from 'bcryptjs';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI } from 'better-auth/plugins';

import { env } from '@/configs';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';

// your drizzle instance

export const auth = betterAuth({
  appName: 'Nusa',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: schema,
  }),
  trustedOrigins: env.TRUSTED_ORIGINS,
  plugins: [openAPI()],
  // emailVerification: {
  //   sendVerificationEmail: async ({ user, url, token }) => {
  //     // TODO: Send verification email to user
  //   },
  //   sendOnSignUp: true,
  //   sendOnSignIn: true,
  //   autoSignInAfterVerification: true,
  //   expiresIn: 3600, // 1 hour
  // },
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false,
    minPasswordLength: 6,
    maxPasswordLength: 128,
    autoSignIn: true,
    // sendResetPassword: async ({ user, url, token }) => {
    //   // TODO: Send reset password email
    // },
    resetPasswordTokenExpiresIn: 3600, // 1 hour
    password: {
      hash: async (password) => {
        const hashedPassword = await bcrypt.hash(password, 10);
        return hashedPassword;
      },
      verify: async ({ hash, password }) => {
        const isValid = await bcrypt.compare(password, hash);
        return isValid;
      },
    },
  },
  user: {
    modelName: 'user',
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'internal',
        input: true, // Allow role to be passed during registration
        returned: true, // Include role in API responses
      },
      bio: {
        type: 'string',
        required: false,
        input: true,
        returned: true,
      },
    },
    changeEmail: {
      enabled: true,
      // sendChangeEmailVerification: async ({ user, newEmail, url, token }) => {
      //   // TODO: Send change email verification
      // },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
    updateAge: 60 * 60 * 24, // Update session every day
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    freshAge: 60 * 60 * 24, // Consider session fresh for 1 day
  },
  cors: {
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
  },
  cookies: {
    sessionToken: {
      name: 'nusa-session',
      options: {
        httpOnly: true,
        sameSite: 'none',
        secure: process.env.NODE_ENV === 'production', // true in production
        path: '/',
        domain:
          process.env.NODE_ENV === 'production'
            ? '.nusa.vtriadi.site'
            : undefined, // Set domain for production
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    },
  },
  advanced: {
    defaultCookieAttributes: {
      name: 'nusa-session',
      sameSite: 'none',
      secure: true,
      domain:
        process.env.NODE_ENV === 'production'
          ? '.nusa.vtriadi.site'
          : undefined, // Set domain for production
      httpOnly: true,
      partitioned: true,
    },
  },
  logger: {
    disabled: false,
    level: 'info',
    log: (level, message, ...args) => {
      // Custom logging implementation
      console.log(`[${level}] ${message}`, ...args);
    },
  },
});
