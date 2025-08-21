import { Strategy as SamlStrategy, Profile as SamlProfile } from '@node-saml/passport-saml';
import passport from 'passport';
import { getSamlStrategyOptions, getSamlConfig } from './saml-config';
import { DUMMY_CERT } from './saml-dummy-cert';
import type { User } from '@car-booking/types';

// Extended SAML Profile with Azure AD attributes
interface AzureADSamlProfile extends SamlProfile {
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn'?: string;
  givenname?: string;
  surname?: string;
  emailaddress?: string;
  name?: string;
  upn?: string;
}

// Map SAML profile to application user
export function mapSamlProfileToUser(profile: AzureADSamlProfile): User {
  // Try different attribute formats (Azure AD may send in different formats)
  const givenName = profile.givenname || 
                    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] || 
                    '';
  
  const surname = profile.surname || 
                  profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] || 
                  '';
  
  const email = profile.emailaddress || 
                profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 
                profile.nameID || 
                '';
  
  const upn = profile.upn || 
              profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn'] || 
              profile.name ||
              profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
              email;

  // Construct full name
  const fullName = `${givenName} ${surname}`.trim() || upn.split('@')[0] || 'Unknown User';

  // Determine role based on email domain or UPN
  // You can customize this logic based on your organization's structure
  const role = determineUserRole(email || upn);

  return {
    name: fullName,
    email: email || upn,
    role: role,
  };
}

// Determine user role based on email or other attributes
function determineUserRole(email: string): 'Employee' | 'Manager' | 'HR' | 'Admin' {
  // Customize this logic based on your organization's needs
  // For example, you might check AD groups, email patterns, etc.
  
  const emailLower = email.toLowerCase();
  
  // Example role mapping logic
  if (emailLower.includes('admin')) {
    return 'Admin';
  } else if (emailLower.includes('hr') || emailLower.includes('human')) {
    return 'HR';
  } else if (emailLower.includes('manager') || emailLower.includes('mgr')) {
    return 'Manager';
  }
  
  return 'Employee';
}

// Initialize SAML strategy
export function initializeSamlStrategy() {
  const options = getSamlStrategyOptions();
  // Use dummy cert if no real cert is available
  if (!options.cert || options.cert === '') {
    options.cert = DUMMY_CERT;
  }
  
  const samlStrategy = new SamlStrategy(
    options,
    async function(req: any, profile: any, done: any) {
      try {
        // Log the raw profile for debugging
        console.log('SAML Profile received:', JSON.stringify(profile, null, 2));
        
        // Map SAML profile to user
        const user = mapSamlProfileToUser(profile as AzureADSamlProfile);
        
        // You can save user to database here if needed
        // await saveUserToDatabase(user);
        
        return done(null, user);
      } catch (error) {
        console.error('SAML authentication error:', error);
        return done(error);
      }
    }
  );

  passport.use('saml', samlStrategy);
  
  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  return samlStrategy;
}

// Generate SP metadata
export async function generateServiceProviderMetadata(): Promise<string> {
  const strategy = initializeSamlStrategy();
  const config = getSamlConfig();
  
  const metadata = strategy.generateServiceProviderMetadata(
    null, // signing cert (optional)
    null  // decryption cert (optional)
  );
  
  // Add additional metadata elements if needed
  const enhancedMetadata = metadata.replace(
    '</EntityDescriptor>',
    `
    <Organization>
      <OrganizationName xml:lang="en">Siam GS Battery</OrganizationName>
      <OrganizationDisplayName xml:lang="en">Car Booking System</OrganizationDisplayName>
      <OrganizationURL xml:lang="en">https://carbooking-sgs.siamgs.co.th</OrganizationURL>
    </Organization>
    <ContactPerson contactType="technical">
      <EmailAddress>${config.certificate.notificationEmail}</EmailAddress>
    </ContactPerson>
    </EntityDescriptor>`
  );
  
  return enhancedMetadata;
}

// Validate SAML response
export function validateSamlResponse(samlResponse: string): boolean {
  try {
    // Basic validation - you can add more sophisticated validation here
    const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(samlResponse);
    if (!isBase64) {
      return false;
    }
    
    // Decode and check for SAML response structure
    const decoded = Buffer.from(samlResponse, 'base64').toString('utf-8');
    return decoded.includes('samlp:Response') || decoded.includes('saml2p:Response');
  } catch (error) {
    console.error('SAML response validation error:', error);
    return false;
  }
}

// Handle SAML logout
export async function handleSamlLogout(user: User): Promise<string> {
  const config = getSamlConfig();
  
  // Construct logout URL with user information
  const logoutUrl = new URL(config.idp.logoutUrl);
  
  // Add return URL
  logoutUrl.searchParams.append('returnTo', config.sp.signOnUrl);
  
  return logoutUrl.toString();
}