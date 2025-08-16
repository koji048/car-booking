import { ConfidentialClientApplication, Configuration, AuthorizationUrlRequest, AuthorizationCodeRequest } from '@azure/msal-node';
import { db } from '@/db';
import { user as userTable } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Microsoft OAuth configuration
const msalConfig: Configuration = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        if (!containsPii) {
          console.log(message);
        }
      },
      piiLoggingEnabled: false,
      logLevel: 3, // Info
    }
  }
};

// Create MSAL application instance
const msalClient = new ConfidentialClientApplication(msalConfig);

export class MicrosoftAuthService {
  private redirectUri: string;

  constructor() {
    this.redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3005/api/auth/microsoft/callback';
  }

  /**
   * Generate the Microsoft OAuth authorization URL
   */
  async getAuthorizationUrl(state: string): Promise<string> {
    const authCodeUrlParameters: AuthorizationUrlRequest = {
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri: this.redirectUri,
      state: state,
      prompt: 'select_account', // Force account selection
    };

    try {
      const authUrl = await msalClient.getAuthCodeUrl(authCodeUrlParameters);
      return authUrl;
    } catch (error) {
      console.error('Error generating auth URL:', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, state: string) {
    const tokenRequest: AuthorizationCodeRequest = {
      code: code,
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri: this.redirectUri,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    };

    try {
      const response = await msalClient.acquireTokenByCode(tokenRequest);
      return response;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  /**
   * Get user profile from Microsoft Graph
   */
  async getUserProfile(accessToken: string) {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const profile = await response.json();
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get user photo from Microsoft Graph (optional)
   */
  async getUserPhoto(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return null; // No photo available
      }

      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.log('No user photo available');
      return null;
    }
  }

  /**
   * Create or update user in database
   */
  async createOrUpdateUser(profile: any, idToken: any) {
    const email = profile.mail || profile.userPrincipalName || idToken.preferred_username;
    const name = profile.displayName || `${profile.givenName} ${profile.surname}` || idToken.name;
    
    // Map job title to role (customize based on your organization)
    const role = this.mapJobTitleToRole(profile.jobTitle);

    // Check if user exists
    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email.toLowerCase()))
      .limit(1);

    let dbUser;

    if (existingUser.length === 0) {
      // Create new user
      const newUserId = crypto.randomUUID();
      const newUserData = {
        id: newUserId,
        email: email.toLowerCase(),
        name: name,
        emailVerified: true, // Microsoft users are pre-verified
        role: role,
        image: await this.getUserPhoto(profile.accessToken),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db
        .insert(userTable)
        .values(newUserData)
        .returning();
      
      dbUser = result[0];
    } else {
      // Update existing user
      dbUser = existingUser[0];
      
      // Update user info if changed
      const updates: any = { updatedAt: new Date() };
      if (dbUser.name !== name) updates.name = name;
      if (dbUser.role !== role) updates.role = role;
      
      if (Object.keys(updates).length > 1) {
        const result = await db
          .update(userTable)
          .set(updates)
          .where(eq(userTable.id, dbUser.id))
          .returning();
        
        dbUser = result[0];
      }
    }

    return dbUser;
  }

  /**
   * Map job title or department to application role
   */
  private mapJobTitleToRole(jobTitle?: string): 'employee' | 'manager' | 'hr' | 'admin' {
    if (!jobTitle) return 'employee';
    
    const title = jobTitle.toLowerCase();
    
    // Customize these mappings based on your organization
    if (title.includes('admin') || title.includes('administrator')) {
      return 'admin';
    } else if (title.includes('hr') || title.includes('human resource')) {
      return 'hr';
    } else if (title.includes('manager') || title.includes('supervisor') || title.includes('lead')) {
      return 'manager';
    }
    
    return 'employee';
  }

  /**
   * Validate Microsoft token
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      // You can implement additional token validation here
      // For now, we'll do a basic check by trying to get user info
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}