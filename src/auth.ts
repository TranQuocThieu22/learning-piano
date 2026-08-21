import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';
import { accounts, sessions, users, verificationTokens } from '@/db/schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google],
  session: {
    // Persist sessions in Postgres (via the adapter above) rather than a JWT
    // cookie, so a login can be revoked by deleting the row.
    strategy: 'database',
  },
  trustHost: true,
  callbacks: {
    session({ session, user }) {
      // The adapter gives us the DB user here; expose its id to the client
      // so we can key lesson-completion rows by it.
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
