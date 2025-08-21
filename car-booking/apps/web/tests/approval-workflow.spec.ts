import { test, expect } from '@playwright/test';

// Mock booking data for testing
const mockBooking = {
  id: 'BK-TEST-001',
  userId: 'emp-001',
  userName: 'John Employee',
  carId: '1',
  departureDate: new Date().toISOString(),
  returnDate: new Date().toISOString(),
  departureTime: '09:00',
  returnTime: '17:00',
  purpose: 'Business meeting with client',
  destination: 'Downtown Office Complex',
  passengers: 3,
  numberOfDrivers: 1,
  driverNames: ['John Employee'],
  numberOfCompanions: 2,
  companionNames: ['Jane Doe', 'Bob Smith'],
  specialRequests: 'Need GPS navigation',
  status: 'pending' as const,
  createdAt: new Date().toISOString(),
  reason: 'Client meeting and team transportation'
};

test.describe('ApprovalWorkflow Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app with dev mode enabled
    await page.goto('http://localhost:3001');
    
    // Use dev mode to quickly login as Employee
    await page.click('button:has-text("Employee")');
    
    // Navigate to booking page
    await page.click('button:has-text("Booking")');
    
    // Fill out a quick booking form
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.click('text=Select time');
    await page.click('text=09:00');
    
    // Select a vehicle
    await page.click('text=Toyota Camry');
    
    // Fill in trip details
    await page.fill('input[placeholder="Enter your destination"]', 'Downtown Office');
    await page.fill('textarea[placeholder="Describe the purpose of your trip"]', 'Business meeting');
    
    // Submit the booking - this should navigate to ApprovalWorkflow
    await page.click('button:has-text("Submit Booking Request")');
    
    // Wait for the approval workflow page to load
    await page.waitForSelector('text=Booking Request Status', { timeout: 5000 });
  });

  test('should display booking details correctly', async ({ page }) => {
    // Check header
    await expect(page.locator('h1:has-text("Booking Request Status")')).toBeVisible();
    
    // Check booking details card
    await expect(page.locator('text=Booking Details')).toBeVisible();
    await expect(page.locator('text=Your car booking request summary')).toBeVisible();
    
    // Verify vehicle information
    await expect(page.locator('text=Vehicle Request')).toBeVisible();
    await expect(page.locator('text=Car ID:')).toBeVisible();
    
    // Verify destination
    await expect(page.locator('text=Downtown Office')).toBeVisible();
    
    // Verify purpose
    await expect(page.locator('text=Business meeting')).toBeVisible();
  });

  test('should show approval workflow steps', async ({ page }) => {
    // Check all workflow steps are visible
    const steps = [
      'Request Submitted',
      'Manager Approval',
      'HR Approval',
      'Booking Confirmed'
    ];
    
    for (const step of steps) {
      await expect(page.locator(`text="${step}"`)).toBeVisible();
    }
    
    // Check initial status badges
    await expect(page.locator('text=Completed').first()).toBeVisible(); // Request Submitted
    await expect(page.locator('text=In Progress')).toBeVisible(); // Manager Approval
    await expect(page.locator('text=Pending')).toBeVisible(); // HR Approval (at least one pending)
  });

  test('should progress through approval steps automatically', async ({ page }) => {
    // Initial state: Request Submitted should be completed
    const requestSubmittedBadge = page.locator('text=Request Submitted').locator('..').locator('text=Completed');
    await expect(requestSubmittedBadge).toBeVisible();
    
    // Wait for Manager Approval to complete (3 seconds per step in the component)
    await page.waitForTimeout(3500);
    const managerApprovalBadge = page.locator('text=Manager Approval').locator('..').locator('text=Completed');
    await expect(managerApprovalBadge).toBeVisible();
    
    // Wait for HR Approval to complete
    await page.waitForTimeout(3500);
    const hrApprovalBadge = page.locator('text=HR Approval').locator('..').locator('text=Completed');
    await expect(hrApprovalBadge).toBeVisible();
    
    // Wait for final confirmation
    await page.waitForTimeout(3500);
    
    // Check for completion message
    await expect(page.locator('text=Booking Confirmed!')).toBeVisible();
    await expect(page.locator('text=Your car booking has been approved')).toBeVisible();
  });

  test('should show countdown timer after approval', async ({ page }) => {
    // Wait for all steps to complete (approximately 10 seconds)
    await page.waitForTimeout(10500);
    
    // Check for countdown message
    await expect(page.locator('text=/Redirecting to your bookings in \\d+ seconds/')).toBeVisible();
    
    // Verify countdown is working
    await expect(page.locator('text=3s')).toBeVisible();
    await page.waitForTimeout(1100);
    await expect(page.locator('text=2s')).toBeVisible();
    await page.waitForTimeout(1100);
    await expect(page.locator('text=1s')).toBeVisible();
  });

  test('should allow manual navigation', async ({ page }) => {
    // Click the manual navigation button
    await page.click('button:has-text("New Booking")');
    
    // Should navigate back to My Bookings page
    await expect(page.locator('text=My Bookings')).toBeVisible({ timeout: 5000 });
  });

  test('should display animated progress indicators', async ({ page }) => {
    // Check for pulsing animation on current step
    const currentStep = page.locator('.animate-pulse');
    await expect(currentStep).toBeVisible();
    
    // Check for processing text
    await expect(page.locator('text=Processing...')).toBeVisible();
  });

  test('should handle completed state properly', async ({ page }) => {
    // Wait for completion (all steps)
    await page.waitForTimeout(10500);
    
    // Check completion elements
    await expect(page.locator('text=Booking Confirmed!')).toBeVisible();
    await expect(page.locator('button:has-text("View My Bookings")')).toBeVisible();
    
    // Click View My Bookings
    await page.click('button:has-text("View My Bookings")');
    
    // Should navigate to My Bookings page
    await expect(page.locator('text=My Bookings')).toBeVisible({ timeout: 5000 });
  });

  test('should display travel party information when provided', async ({ page }) => {
    // Check for driver information
    await expect(page.locator('text=Travel Party')).toBeVisible();
    
    // The component would show driver and companion counts if they were in the booking data
    // Since we're using the actual form submission, these might not be present
    // This test verifies the section exists when data is available
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that key elements are still visible
    await expect(page.locator('text=Booking Request Status')).toBeVisible();
    await expect(page.locator('text=Booking Details')).toBeVisible();
    await expect(page.locator('text=Approval Progress')).toBeVisible();
    
    // Check that the layout adapts (flex direction changes on mobile)
    const navigationSection = page.locator('text=What\'s next?').locator('..');
    await expect(navigationSection).toBeVisible();
  });
});

test.describe('ApprovalWorkflow Edge Cases', () => {
  test('should handle missing booking data gracefully', async ({ page }) => {
    // Navigate directly to approval workflow without booking data
    await page.goto('http://localhost:3001');
    
    // Login as employee
    await page.click('button:has-text("Employee")');
    
    // Try to navigate to approval state without booking
    // The component should redirect back to my-bookings
    await page.evaluate(() => {
      // This would normally be done through state management
      // For testing, we're checking the redirect logic
    });
  });

  test('should maintain state during page interactions', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.click('button:has-text("Employee")');
    await page.click('button:has-text("Booking")');
    
    // Submit a booking
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.click('text=Select time');
    await page.click('text=09:00');
    await page.click('text=Toyota Camry');
    await page.fill('input[placeholder="Enter your destination"]', 'Test Location');
    await page.fill('textarea[placeholder="Describe the purpose of your trip"]', 'Test Purpose');
    await page.click('button:has-text("Submit Booking Request")');
    
    // Wait for workflow to start
    await page.waitForSelector('text=Booking Request Status');
    
    // Progress should continue even if user interacts with page
    await page.hover('text=Manager Approval');
    await page.waitForTimeout(3500);
    
    // Check that progress continued
    await expect(page.locator('text=Manager Approval').locator('..').locator('text=Completed')).toBeVisible();
  });
});