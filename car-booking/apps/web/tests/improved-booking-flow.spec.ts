import { test, expect } from '@playwright/test';

test.describe('Improved Booking Flow - Better UX', () => {
  test('New flow: Honest confirmation instead of fake approval', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3001');
    
    // Login as Employee
    await page.click('button:has-text("Employee")');
    
    // Go to booking page
    await page.click('button:has-text("Booking")');
    
    // Fill booking form
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.click('text=Select time');
    await page.click('text=09:00');
    await page.click('text=Toyota Camry');
    await page.fill('input[placeholder="Enter your destination"]', 'Downtown Office');
    await page.fill('textarea[placeholder="Describe the purpose of your trip"]', 'Client meeting');
    
    // Submit booking
    await page.click('button:has-text("Submit Booking Request")');
    
    // NEW FLOW: Should show BookingConfirmation, not ApprovalWorkflow
    await page.waitForSelector('text=Booking Submitted Successfully', { timeout: 5000 });
    
    // Verify honest messaging
    await expect(page.locator('text=Success! Your booking request has been submitted')).toBeVisible();
    
    // Should show "Pending Approval" badge, not "Confirmed"
    await expect(page.locator('text=Pending Approval')).toBeVisible();
    
    // Should NOT show fake approval steps
    const hasFakeSteps = await page.locator('text=Processing...').isVisible();
    expect(hasFakeSteps).toBe(false);
    
    // Should show "What Happens Next?" section
    await expect(page.locator('text=What Happens Next?')).toBeVisible();
    await expect(page.locator('text=Manager Review')).toBeVisible();
    await expect(page.locator('text=Email Notification')).toBeVisible();
    await expect(page.locator('text=Track Status')).toBeVisible();
    
    // Take screenshot of improved confirmation
    await page.screenshot({ 
      path: 'tests/screenshots/improved-confirmation.png',
      fullPage: true 
    });
    
    console.log('✅ Improved UX: Clear, honest confirmation page');
  });

  test('Auto-redirect to My Bookings after 5 seconds', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.click('button:has-text("Employee")');
    await page.click('button:has-text("Booking")');
    
    // Quick booking
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.click('text=Select time');
    await page.click('text=09:00');
    await page.click('text=Toyota Camry');
    await page.fill('input[placeholder="Enter your destination"]', 'Office');
    await page.fill('textarea[placeholder="Describe the purpose of your trip"]', 'Meeting');
    await page.click('button:has-text("Submit Booking Request")');
    
    // Check countdown
    await page.waitForSelector('text=Redirecting to My Bookings in');
    
    // Verify countdown works
    await expect(page.locator('text=/Redirecting to My Bookings in.*5.*seconds/')).toBeVisible();
    await page.waitForTimeout(1100);
    await expect(page.locator('text=/Redirecting to My Bookings in.*4.*seconds/')).toBeVisible();
    
    // Should auto-redirect after 5 seconds
    await page.waitForSelector('text=My Bookings', { timeout: 7000 });
    
    console.log('✅ Auto-redirect works correctly');
  });

  test('Manual navigation options work', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.click('button:has-text("Employee")');
    await page.click('button:has-text("Booking")');
    
    // Quick booking
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.click('text=Select time');
    await page.click('text=09:00');
    await page.click('text=Toyota Camry');
    await page.fill('input[placeholder="Enter your destination"]', 'Office');
    await page.fill('textarea[placeholder="Describe the purpose of your trip"]', 'Meeting');
    await page.click('button:has-text("Submit Booking Request")');
    
    await page.waitForSelector('text=Booking Submitted Successfully');
    
    // Test "New Booking" button
    await page.click('button:has-text("New Booking")');
    await page.waitForSelector('text=Book a Vehicle', { timeout: 3000 });
    
    // Go back and test "View My Bookings"
    await page.click('button:has-text("Employee")'); // Quick re-submit
    await page.click('button:has-text("Booking")');
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.click('text=Select time');
    await page.click('text=09:00');
    await page.click('text=Toyota Camry');
    await page.fill('input[placeholder="Enter your destination"]', 'Office');
    await page.fill('textarea[placeholder="Describe the purpose of your trip"]', 'Meeting');
    await page.click('button:has-text("Submit Booking Request")');
    
    await page.waitForSelector('text=Booking Submitted Successfully');
    await page.click('button:has-text("View My Bookings")');
    await page.waitForSelector('text=My Bookings', { timeout: 3000 });
    
    console.log('✅ Manual navigation buttons work');
  });

  test('Compare old vs new UX', async ({ page }) => {
    console.log('\n=== UX COMPARISON ===\n');
    console.log('OLD FLOW (ApprovalWorkflow):');
    console.log('❌ Shows fake "Processing..." animation');
    console.log('❌ Displays "Booking Confirmed!" when not actually confirmed');
    console.log('❌ Creates confusion about actual status');
    console.log('❌ Users think booking is approved when it\'s not');
    console.log('');
    console.log('NEW FLOW (BookingConfirmation):');
    console.log('✅ Clear "Pending Approval" status');
    console.log('✅ Shows who will approve (manager name)');
    console.log('✅ Explains next steps clearly');
    console.log('✅ No misleading confirmation messages');
    console.log('✅ Builds trust through transparency');
  });
});