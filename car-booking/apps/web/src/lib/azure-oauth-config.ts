/**
 * Azure AD OAuth 2.0 Configuration
 * Using Microsoft Authentication Library (MSAL)
 */

import { Configuration, LogLevel } from '@azure/msal-node';

// Azure AD Application Configuration
export const azureConfig = {
  auth: {
    clientId: '8dbe7621-14fe-46aa-9968-77d6500e429e', // Your Application (client) ID
    tenantId: 'ead30324-2c2a-42bf-9541-bf96019df2c6', // Your Directory (tenant) ID
    clientSecret: process.env.AZURE_CLIENT_SECRET || '', // Will need to be set in .env.local
  },
  endpoints: {
    authority: 'https://login.microsoftonline.com/ead30324-2c2a-42bf-9541-bf96019df2c6',
    redirectUri: process.env.NODE_ENV === 'production' 
      ? 'https://carbooking-sgs.siamgs.co.th/api/auth/microsoft/callback'
      : 'http://localhost:3001/api/auth/microsoft/callback',
    postLogoutRedirectUri: process.env.NODE_ENV === 'production'
      ? 'https://carbooking-sgs.siamgs.co.th/login'
      : 'http://localhost:3001/login',
  },
  scopes: {
    default: ['openid', 'profile', 'email', 'User.Read', 'Directory.Read.All', 'Group.Read.All'],
  }
};

// MSAL Configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: azureConfig.auth.clientId,
    authority: azureConfig.endpoints.authority,
    clientSecret: azureConfig.auth.clientSecret,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        if (!containsPii) {
          console.log(`[MSAL] ${message}`);
        }
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Info,
    }
  }
};

// OAuth URLs
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: azureConfig.auth.clientId,
    response_type: 'code',
    redirect_uri: azureConfig.endpoints.redirectUri,
    response_mode: 'query',
    scope: azureConfig.scopes.default.join(' '),
    state: state,
    prompt: 'select_account', // Force account selection
  });

  return `${azureConfig.endpoints.authority}/oauth2/v2.0/authorize?${params}`;
}

// Token endpoint
export function getTokenEndpoint(): string {
  return `${azureConfig.endpoints.authority}/oauth2/v2.0/token`;
}

// Logout URL - properly logs out from Azure AD
export function getLogoutUrl(): string {
  const params = new URLSearchParams({
    post_logout_redirect_uri: azureConfig.endpoints.postLogoutRedirectUri,
  });
  
  // This will log the user out of Azure AD completely
  // If you want to keep them logged in to Azure AD but just log out of the app,
  // you can simply redirect to /login instead
  return `${azureConfig.endpoints.authority}/oauth2/v2.0/logout?${params}`;
}

// Microsoft Graph API endpoint for user info
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphPhotoEndpoint: 'https://graph.microsoft.com/v1.0/me/photo/$value',
};