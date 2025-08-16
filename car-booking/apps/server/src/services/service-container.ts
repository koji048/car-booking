import { BookingService } from "./booking.service";
import { ApprovalService } from "./approval.service";
import { NotificationService } from "./notification.service";
import { VehicleService } from "./vehicle.service";

/**
 * Service Container for dependency injection
 * Ensures singleton pattern for services and proper lifecycle management
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  
  private notificationService: NotificationService;
  private bookingService: BookingService;
  private approvalService: ApprovalService;
  private vehicleService: VehicleService;
  
  private constructor() {
    // Initialize services in correct dependency order
    this.notificationService = new NotificationService();
    this.bookingService = new BookingService(this.notificationService);
    this.approvalService = new ApprovalService(this.notificationService);
    this.vehicleService = new VehicleService();
  }
  
  /**
   * Get singleton instance of ServiceContainer
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
  
  /**
   * Reset instance (useful for testing)
   */
  static resetInstance(): void {
    ServiceContainer.instance = undefined as any;
  }
  
  // Service getters
  getBookingService(): BookingService {
    return this.bookingService;
  }
  
  getApprovalService(): ApprovalService {
    return this.approvalService;
  }
  
  getNotificationService(): NotificationService {
    return this.notificationService;
  }
  
  getVehicleService(): VehicleService {
    return this.vehicleService;
  }
}

// Export singleton instance getter for convenience
export const getServices = () => ServiceContainer.getInstance();