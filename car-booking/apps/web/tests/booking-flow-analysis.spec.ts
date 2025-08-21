import { test, expect } from '@playwright/test';

test.describe('UX Analysis: Booking Submission Flow', () => {
  test('Analyze redundant approval workflow after submission', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3001');
    
    // Login as Employee using dev mode
    await page.click('button:has-text("Employee")');
    
    // Go to booking page
    await page.click('button:has-text("Booking")');
    
    // Fill minimal booking form
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.click('text=Select time');
    await page.click('text=09:00');
    await page.click('text=Toyota Camry');
    await page.fill('input[placeholder="Enter your destination"]', 'Test Location');
    await page.fill('textarea[placeholder="Describe the purpose of your trip"]', 'Test Purpose');
    
    // Take screenshot before submission
    await page.screenshot({ 
      path: 'tests/screenshots/before-submission.png',
      fullPage: true 
    });
    
    // Submit booking
    await page.click('button:has-text("Submit Booking Request")');
    
    // PROBLEM 1: Mock approval workflow appears immediately
    await page.waitForSelector('text=Booking Request Status', { timeout: 5000 });
    
    // Take screenshot of mock approval workflow
    await page.screenshot({ 
      path: 'tests/screenshots/mock-approval-workflow.png',
      fullPage: true 
    });
    
    // Wait for simulated steps
    await page.waitForTimeout(1000);
    
    // Check what's displayed
    const hasSimulatedProgress = await page.locator('text=Processing...').isVisible();
    const hasCompletedBadge = await page.locator('text=Completed').first().isVisible();
    
    console.log('UX Issues Found:');
    console.log('1. Simulated progress shown:', hasSimulatedProgress);
    console.log('2. Shows "Completed" for submitted step:', hasCompletedBadge);
    
    // Wait for full simulation (about 10 seconds)
    await page.waitForTimeout(10500);
    
    // PROBLEM 2: Shows "Booking Confirmed!" when it's not actually confirmed
    const confirmationMessage = await page.locator('text=Booking Confirmed!').isVisible();
    console.log('3. Shows false confirmation:', confirmationMessage);
    
    // Take screenshot of false confirmation
    await page.screenshot({ 
      path: 'tests/screenshots/false-confirmation.png',
      fullPage: true 
    });
    
    // Navigate to My Bookings
    await page.click('button:has-text("View My Bookings")');
    
    // PROBLEM 3: In My Bookings, the status would still be "pending"
    await page.waitForSelector('text=My Bookings', { timeout: 5000 });
    
    // The booking would show as pending here, contradicting the "confirmed" message
    await page.screenshot({ 
      path: 'tests/screenshots/my-bookings-pending.png',
      fullPage: true 
    });
  });

  test('Verify actual vs simulated approval confusion', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.click('button:has-text("Employee")');
    await page.click('button:has-text("Booking")');
    
    // Check manager info display
    const managerInfo = await page.locator('text=/Your booking request will be sent to/').isVisible();
    console.log('Shows real manager info:', managerInfo);
    
    // Submit booking
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.click('text=Select time');
    await page.click('text=09:00');
    await page.click('text=Toyota Camry');
    await page.fill('input[placeholder="Enter your destination"]', 'Office');
    await page.fill('textarea[placeholder="Describe the purpose of your trip"]', 'Meeting');
    await page.click('button:has-text("Submit Booking Request")');
    
    // Check for conflicting messages
    await page.waitForSelector('text=Booking Request Status');
    
    // Look for simulated approval steps
    const simulatedSteps = [
      'Manager Approval',
      'HR Approval',
      'Booking Confirmed'
    ];
    
    for (const step of simulatedSteps) {
      const isVisible = await page.locator(`text="${step}"`).isVisible();
      console.log(`Simulated step "${step}" visible:`, isVisible);
    }
    
    // The real status would be just "pending" with manager
    // but UI shows complete workflow simulation
  });

  test('Better UX: What should happen after submission', async ({ page }) => {
    // This test documents the EXPECTED behavior
    
    console.log('\n=== RECOMMENDED UX FLOW ===\n');
    console.log('1. Employee submits booking');
    console.log('2. Show success toast: "Booking submitted to [Manager Name]"');
    console.log('3. Navigate directly to My Bookings page');
    console.log('4. Show the new booking with "Pending" status');
    console.log('5. NO simulated approval workflow');
    console.log('6. Real-time updates when manager actually approves');
    console.log('\n=== Benefits ===');
    console.log('- No confusion about approval status');
    console.log('- Clear understanding that manager needs to act');
    console.log('- Consistent status across all views');
    console.log('- Trust in the system (no fake confirmations)');
  });
});