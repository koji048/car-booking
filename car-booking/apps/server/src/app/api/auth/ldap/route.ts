import { NextRequest, NextResponse } from 'next/server';
import { ldapAuth } from '@/lib/ldap-auth';
import { mockLdapAuth } from '@/lib/ldap-mock';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user as userTable, session as sessionTable } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Use real LDAP if password is configured, otherwise use mock
    const useMockLdap = !process.env.LDAP_ADMIN_PASSWORD || process.env.LDAP_ADMIN_PASSWORD === 'YourPasswordHere';
    
    console.log(`Authenticating user with ${useMockLdap ? 'Mock' : 'Real'} LDAP:`, username);
    
    const ldapUser = useMockLdap 
      ? await mockLdapAuth.authenticate(username, password)
      : await ldapAuth.authenticate(username, password);

    if (!ldapUser) {
      return NextResponse.json(
        { error: 'Invalid credentials or user not found in Active Directory' },
        { status: 401 }
      );
    }

    // Check if user exists in database
    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, ldapUser.email))
      .limit(1);

    let dbUser;

    if (existingUser.length === 0) {
      // Create new user in database directly
      const newUserId = crypto.randomUUID();
      const newUserData = {
        id: newUserId,
        email: ldapUser.email,
        name: ldapUser.displayName,
        emailVerified: true, // LDAP users are pre-verified
        role: ldapUser.role,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db
        .insert(userTable)
        .values(newUserData)
        .returning();
      
      dbUser = result[0];
    } else {
      // Update existing user's role if changed
      dbUser = existingUser[0];
      
      if (existingUser[0].role !== ldapUser.role) {
        const result = await db
          .update(userTable)
          .set({ 
            role: ldapUser.role,
            updatedAt: new Date()
          })
          .where(eq(userTable.id, dbUser.id))
          .returning();
        
        dbUser = result[0];
      }
    }

    // Create session directly since password is already validated by LDAP
    const sessionId = crypto.randomUUID();
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await db.insert(sessionTable).values({
      id: sessionId,
      userId: dbUser.id,
      token: sessionToken,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      userAgent: request.headers.get('user-agent') || ''
    });

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: ldapUser.email,
        name: ldapUser.displayName,
        role: ldapUser.role,
        department: ldapUser.department,
        title: ldapUser.title
      },
      session: {
        id: sessionId,
        token: sessionToken,
        expiresAt: expiresAt.toISOString()
      }
    });

  } catch (error: any) {
    console.error('LDAP authentication error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}