import { NextRequest, NextResponse } from 'next/server';
import { ldapConfig } from '@/lib/ldap-config';

// GET - Check if LDAP server is accessible
export async function GET(request: NextRequest) {
  try {
    // Extract server and port from LDAP URL
    const ldapUrl = ldapConfig.url;
    const urlMatch = ldapUrl.match(/ldap:\/\/([^:]+):(\d+)/);
    
    if (!urlMatch) {
      return NextResponse.json({
        available: false,
        reason: 'Invalid LDAP configuration'
      }, { status: 503 });
    }

    const [, host, port] = urlMatch;
    
    // Try to check LDAP server connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    try {
      // Try a simple TCP connection check
      const response = await fetch(`http://${host}:${port}`, {
        signal: controller.signal,
        method: 'HEAD'
      }).catch(() => null);
      
      clearTimeout(timeoutId);

      // For LDAP, we just need to know if we can reach the server
      // Even if HTTP fails, if we didn't timeout, the server is likely reachable
      if (!response || controller.signal.aborted) {
        // Try ping as fallback check
        const { exec } = require('child_process');
        const pingResult = await new Promise((resolve) => {
          exec(`ping -c 1 -W 1 ${host}`, (error: any) => {
            resolve(!error);
          });
        });

        if (!pingResult) {
          return NextResponse.json({
            available: false,
            reason: 'LDAP server unreachable - Network may be restricted',
            server: host,
            port: port
          }, { status: 503 });
        }
      }

      return NextResponse.json({
        available: true,
        server: host,
        port: port,
        configured: true
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          available: false,
          reason: 'Network timeout - LDAP server may be blocked',
          server: host,
          port: port
        }, { status: 503 });
      }
      
      return NextResponse.json({
        available: false,
        reason: 'Network error - Unable to reach LDAP server',
        server: host,
        port: port
      }, { status: 503 });
    }
  } catch (error: any) {
    console.error('LDAP check error:', error);
    return NextResponse.json({
      available: false,
      reason: 'Internal error checking LDAP availability'
    }, { status: 500 });
  }
}