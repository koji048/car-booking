-- Performance indexes for car booking system
-- Run this migration to improve query performance

-- Bookings table indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_date ON bookings(vehicle_id, departure_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_status_date ON bookings(status, departure_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Composite index for conflict checking queries
CREATE INDEX IF NOT EXISTS idx_bookings_conflict_check 
ON bookings(vehicle_id, status, departure_date, departure_time, return_date, return_time)
WHERE status IN ('approved', 'pending_manager', 'pending_hr');

-- Approvals table indexes
CREATE INDEX IF NOT EXISTS idx_approvals_booking_id ON approvals(booking_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_level_status ON approvals(approval_level, status);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON notifications(booking_id);

-- Booking travelers index
CREATE INDEX IF NOT EXISTS idx_booking_travelers_booking_id ON booking_travelers(booking_id);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_user_manager_id ON "user"(manager_id);
CREATE INDEX IF NOT EXISTS idx_user_department_id ON "user"(department_id);
CREATE INDEX IF NOT EXISTS idx_user_role ON "user"(role);

-- Vehicles table indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- Audit logs indexes (if you add audit table later)
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);