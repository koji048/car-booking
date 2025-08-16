import ldap from 'ldapjs';
import { ldapConfig, getRoleFromGroups } from './ldap-config';

export interface LDAPUser {
  username: string;
  displayName: string;
  email: string;
  role: string;
  department?: string;
  title?: string;
  employeeId?: string;
  groups: string[];
}

export class LDAPAuthService {
  private client: ldap.Client | null = null;

  // Create LDAP client connection
  private async connect(): Promise<ldap.Client> {
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({
        url: ldapConfig.url,
        ...ldapConfig.options
      });

      client.on('error', (err) => {
        console.error('LDAP connection error:', err);
        reject(err);
      });

      client.on('connect', () => {
        console.log('Connected to LDAP server');
        this.client = client;
        resolve(client);
      });
    });
  }

  // Bind with admin credentials
  private async bindAdmin(client: ldap.Client): Promise<void> {
    return new Promise((resolve, reject) => {
      const adminDN = ldapConfig.adminDN;
      const adminPassword = ldapConfig.adminPassword;
      
      console.log('Attempting admin bind with DN:', adminDN);
      console.log('Password length:', adminPassword?.length || 0);
      console.log('Password from env:', process.env.LDAP_ADMIN_PASSWORD);
      console.log('Password from config:', ldapConfig.adminPassword);
      
      client.bind(adminDN, adminPassword, (err) => {
        if (err) {
          console.error('Admin bind failed:', err);
          console.error('DN used:', adminDN);
          reject(err);
        } else {
          console.log('Admin bind successful');
          resolve();
        }
      });
    });
  }

  // Search for user in AD
  private async searchUser(client: ldap.Client, username: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Remove @domain part if present
      const cleanUsername = username.split('@')[0];
      const searchFilter = ldapConfig.searchFilter.replace('{{username}}', cleanUsername);
      
      console.log('Searching for user with filter:', searchFilter);
      console.log('Search base DN:', ldapConfig.baseDN);
      
      const opts = {
        filter: searchFilter,
        scope: 'sub',
        attributes: ldapConfig.searchAttributes
      };

      const searchResults: any[] = [];

      client.search(ldapConfig.baseDN, opts, (err, res) => {
        if (err) {
          console.error('Search error:', err);
          reject(err);
          return;
        }

        res.on('searchEntry', (entry) => {
          const user = entry.pojo || entry.object || entry.attributes;
          console.log('Found user entry:', JSON.stringify(user, null, 2));
          searchResults.push(user);
        });

        res.on('error', (err) => {
          console.error('Search stream error:', err);
          reject(err);
        });

        res.on('end', (result) => {
          console.log('Search ended. Results found:', searchResults.length);
          console.log('Search result status:', result?.status);
          if (searchResults.length === 0) {
            reject(new Error('User not found'));
          } else {
            resolve(searchResults[0]);
          }
        });
      });
    });
  }

  // Authenticate user with password
  private async authenticateUser(client: ldap.Client, userDN: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      const userClient = ldap.createClient({
        url: ldapConfig.url,
        ...ldapConfig.options
      });

      userClient.bind(userDN, password, (err) => {
        userClient.unbind();
        
        if (err) {
          console.log('User authentication failed:', err.message);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  // Main authentication method
  public async authenticate(username: string, password: string): Promise<LDAPUser | null> {
    let client: ldap.Client | null = null;

    try {
      // Connect to LDAP server
      client = await this.connect();
      
      // Bind as admin to search for user
      await this.bindAdmin(client);
      
      // Search for user
      const adUser = await this.searchUser(client, username);
      
      if (!adUser) {
        throw new Error('User not found in Active Directory');
      }

      // Get the user's DN from the search result
      const userDN = adUser.objectName || adUser.dn || adUser.distinguishedName;
      console.log('User DN for authentication:', userDN);
      
      // Extract attributes from the LDAP entry structure
      const attributes: any = {};
      if (adUser.attributes && Array.isArray(adUser.attributes)) {
        adUser.attributes.forEach((attr: any) => {
          if (attr.values && attr.values.length > 0) {
            attributes[attr.type] = attr.values.length === 1 ? attr.values[0] : attr.values;
          }
        });
      }
      console.log('Extracted attributes:', attributes);
      
      // Authenticate user with their password
      const isAuthenticated = await this.authenticateUser(client, userDN, password);
      
      if (!isAuthenticated) {
        throw new Error('Invalid password');
      }

      // Extract user information from attributes
      const ldapUser: LDAPUser = {
        username: attributes.sAMAccountName || username,
        displayName: attributes.displayName || username,
        email: attributes.mail || `${username}@gsbattery.co.th`,
        role: getRoleFromGroups(attributes.memberOf || []),
        department: attributes.department,
        title: attributes.title,
        employeeId: attributes.employeeID,
        groups: Array.isArray(attributes.memberOf) ? attributes.memberOf : [attributes.memberOf].filter(Boolean)
      };

      return ldapUser;

    } catch (error) {
      console.error('LDAP authentication error:', error);
      return null;
    } finally {
      // Clean up connection
      if (client) {
        client.unbind();
      }
    }
  }

  // Validate user exists in AD (without password)
  public async validateUser(username: string): Promise<boolean> {
    let client: ldap.Client | null = null;

    try {
      client = await this.connect();
      await this.bindAdmin(client);
      const user = await this.searchUser(client, username);
      return !!user;
    } catch (error) {
      console.error('User validation error:', error);
      return false;
    } finally {
      if (client) {
        client.unbind();
      }
    }
  }

  // Get user groups
  public async getUserGroups(username: string): Promise<string[]> {
    let client: ldap.Client | null = null;

    try {
      client = await this.connect();
      await this.bindAdmin(client);
      const user = await this.searchUser(client, username);
      
      if (user && user.memberOf) {
        return Array.isArray(user.memberOf) ? user.memberOf : [user.memberOf];
      }
      
      return [];
    } catch (error) {
      console.error('Get user groups error:', error);
      return [];
    } finally {
      if (client) {
        client.unbind();
      }
    }
  }
}

// Export singleton instance
export const ldapAuth = new LDAPAuthService();