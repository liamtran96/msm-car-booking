-- Migration: 005_create_notification_tables
-- Description: Create notification system tables
-- Author: System
-- Date: 2026-01-30

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    channel notification_channel NOT NULL,
    notification_type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status notification_status NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_booking ON notifications(booking_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_pending ON notifications(status, created_at)
    WHERE status = 'PENDING';

COMMENT ON TABLE notifications IS 'System notifications sent to users';
COMMENT ON COLUMN notifications.channel IS 'APP_PUSH, AUTO_CALL, or SMS';
COMMENT ON COLUMN notifications.notification_type IS 'Type of notification event';
COMMENT ON COLUMN notifications.sent_at IS 'Timestamp when notification was actually sent';
