/**
 * SAML Configuration for Microsoft Entra ID (Azure AD)
 * Configuration based on production settings for carbooking-sgs.siamgs.co.th
 */

export const samlConfig = {
  // Service Provider (SP) Configuration - Your Application
  sp: {
    entityId: 'https://carbooking-sgs.siamgs.co.th/saml/metadata',
    assertionConsumerServiceUrl: 'https://carbooking-sgs.siamgs.co.th/saml/acs',
    logoutUrl: 'https://carbooking-sgs.siamgs.co.th/saml/logout',
    signOnUrl: 'https://carbooking-sgs.siamgs.co.th/login',
  },

  // Identity Provider (IdP) Configuration - Microsoft Entra ID
  idp: {
    entryPoint: 'https://login.microsoftonline.com/ead30324-2c2a-42bf-9541-bf96019df2c6/saml2',
    issuer: 'https://sts.windows.net/ead30324-2c2a-42bf-9541-bf96019df2c6/',
    logoutUrl: 'https://login.microsoftonline.com/ead30324-2c2a-42bf-9541-bf96019df2c6/saml2',
    metadataUrl: 'https://login.microsoftonline.com/ead30324-2c2a-42bf-9541-bf96019df2c6/federationmetadata/2007-06/federationmetadata.xml?appid=8dbe7621-14fe-46aa-9968-77d6500e429e',
    thumbprint: '3F963055EFDCD7B58425F31CB970DF27CC2A8A6D',
  },

  // Attribute Mapping from SAML Claims to User Profile
  attributeMapping: {
    givenName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
    surname: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
    email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    nameId: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
    upn: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn',
  },

  // Certificate Configuration
  certificate: {
    expirationDate: '2028-08-20T10:50:23.000Z',
    notificationEmail: 'phongsaton.v@gsbattery.co.th',
  },

  // Environment-specific overrides for development
  development: {
    sp: {
      entityId: process.env.SAML_SP_ENTITY_ID || 'http://localhost:3001/saml/metadata',
      assertionConsumerServiceUrl: process.env.SAML_SP_ACS_URL || 'http://localhost:3001/saml/acs',
      logoutUrl: process.env.SAML_SP_LOGOUT_URL || 'http://localhost:3001/saml/logout',
      signOnUrl: process.env.SAML_SP_SIGNON_URL || 'http://localhost:3001/login',
    },
  },
};

// Helper function to get environment-specific config
export function getSamlConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment && samlConfig.development) {
    return {
      ...samlConfig,
      sp: {
        ...samlConfig.sp,
        ...samlConfig.development.sp,
      },
    };
  }
  
  return samlConfig;
}

// SAML Strategy options for passport-saml
export function getSamlStrategyOptions() {
  const config = getSamlConfig();
  
  return {
    // Service Provider settings
    callbackUrl: config.sp.assertionConsumerServiceUrl,
    issuer: config.sp.entityId,
    
    // Identity Provider settings
    entryPoint: config.idp.entryPoint,
    idpIssuer: config.idp.issuer,
    logoutUrl: config.idp.logoutUrl,
    
    // Certificate validation (you'll need to add the actual certificate)
    cert: process.env.SAML_IDP_CERT || '', // Base64 encoded certificate from Azure AD
    idpCert: process.env.SAML_IDP_CERT || '', // Alternative name for the certificate
    
    // Response validation
    validateInResponseTo: 'never' as const,
    disableRequestedAuthnContext: true,
    
    // Signature validation
    signatureAlgorithm: 'sha256',
    digestAlgorithm: 'sha256',
    
    // Attribute consumption
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: false,
    
    // Session settings
    passReqToCallback: true,
    
    // Attribute mapping
    attributeConsumingServiceIndex: false,
    skipRequestCompression: true,
    authnRequestBinding: 'HTTP-Redirect',
  };
}