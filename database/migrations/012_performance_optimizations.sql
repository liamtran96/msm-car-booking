-- Migration: 012_performance_optimizations
-- Description: Performance optimizations based on PostgreSQL best practices
-- Author: Database Performance Review
-- Date: 2026-01-30

-- ============================================================================
-- 1. Enable Query Performance Monitoring
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

COMMENT ON EXTENSION pg_stat_statements IS 'Track execution statistics of all SQL statements';

-- View for identifying slow queries
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT
    round(total_exec_time::numeric, 2) as total_time_ms,
    calls,
    round(mean_exec_time::numeric, 2) as avg_time_ms,
    round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) as percentage,
    substring(query, 1, 200) as query_preview
FROM pg_stat_statements
WHERE calls > 10
ORDER BY total_exec_time DESC
LIMIT 50;

COMMENT ON VIEW v_slow_queries IS 'Top 50 slowest queries by total execution time';

-- ============================================================================
-- 2. Additional Performance Indexes
-- ============================================================================

-- Booking calendar queries (date range lookups)
CREATE INDEX IF NOT EXISTS idx_bookings_calendar
    ON bookings(scheduled_date, scheduled_time, status)
    WHERE status NOT IN ('COMPLETED', 'CANCELLED', 'REDIRECTED_EXTERNAL');

-- Vehicle search (booking UI dropdown)
CREATE INDEX IF NOT EXISTS idx_vehicles_search
    ON vehicles(vehicle_type, capacity)
    WHERE is_active = true AND status = 'AVAILABLE';

-- User phone lookup (driver app authentication)
CREATE INDEX IF NOT EXISTS idx_users_phone
    ON users(phone)
    WHERE phone IS NOT NULL AND is_active = true;

-- Booking by date for reporting
CREATE INDEX IF NOT EXISTS idx_bookings_date_dept
    ON bookings(scheduled_date, department_id)
    WHERE status = 'COMPLETED';

-- GPS latest position lookup (BRIN index for time-series)
-- Note: Only for non-partitioned table, skip if using partitioning
-- CREATE INDEX IF NOT EXISTS idx_gps_brin ON gps_locations USING BRIN (recorded_at);

COMMENT ON INDEX idx_bookings_calendar IS 'Optimizes booking calendar/schedule views';
COMMENT ON INDEX idx_vehicles_search IS 'Optimizes vehicle selection dropdowns';

-- ============================================================================
-- 3. Autovacuum Tuning for High-Write Tables
-- ============================================================================

-- GPS locations: Very high write volume
ALTER TABLE gps_locations SET (
    autovacuum_vacuum_scale_factor = 0.01,      -- Vacuum at 1% dead tuples (default 20%)
    autovacuum_vacuum_threshold = 1000,          -- Minimum 1000 dead tuples
    autovacuum_analyze_scale_factor = 0.005,    -- Analyze at 0.5% changes
    autovacuum_analyze_threshold = 500
);

-- Bookings: Moderate write, frequent updates
ALTER TABLE bookings SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);

-- Notifications: High write, many status updates
ALTER TABLE notifications SET (
    autovacuum_vacuum_scale_factor = 0.02,
    autovacuum_analyze_scale_factor = 0.01
);

-- Audit logs: Append-only, high volume
ALTER TABLE audit_logs SET (
    autovacuum_vacuum_scale_factor = 0.1,       -- Less aggressive (append-only)
    autovacuum_analyze_scale_factor = 0.05
);

-- ============================================================================
-- 4. Table Statistics for Better Query Plans
-- ============================================================================

-- Increase statistics target for frequently filtered columns
ALTER TABLE bookings ALTER COLUMN status SET STATISTICS 200;
ALTER TABLE bookings ALTER COLUMN scheduled_date SET STATISTICS 200;
ALTER TABLE bookings ALTER COLUMN department_id SET STATISTICS 150;

ALTER TABLE vehicles ALTER COLUMN status SET STATISTICS 150;
ALTER TABLE vehicles ALTER COLUMN vehicle_type SET STATISTICS 150;

ALTER TABLE users ALTER COLUMN role SET STATISTICS 150;
ALTER TABLE users ALTER COLUMN department_id SET STATISTICS 150;

ALTER TABLE notifications ALTER COLUMN status SET STATISTICS 200;

-- Force analyze to update statistics
ANALYZE bookings;
ANALYZE vehicles;
ANALYZE users;
ANALYZE notifications;
ANALYZE gps_locations;

-- ============================================================================
-- 5. Materialized View for Dashboard Statistics
-- ============================================================================

-- Pre-computed daily statistics (refresh periodically)
CREATE MATERIALIZED VIEW mv_daily_stats AS
SELECT
    scheduled_date as date,
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
    COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled,
    COUNT(*) FILTER (WHERE status = 'REDIRECTED_EXTERNAL') as external,
    COALESCE(SUM(actual_km) FILTER (WHERE status = 'COMPLETED'), 0) as total_km,
    COUNT(DISTINCT assigned_vehicle_id) FILTER (WHERE status = 'COMPLETED') as vehicles_used,
    COUNT(DISTINCT assigned_driver_id) FILTER (WHERE status = 'COMPLETED') as drivers_active
FROM bookings
WHERE scheduled_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY scheduled_date
ORDER BY scheduled_date DESC;

CREATE UNIQUE INDEX idx_mv_daily_stats_date ON mv_daily_stats(date);

COMMENT ON MATERIALIZED VIEW mv_daily_stats IS 'Pre-computed daily booking statistics. Refresh with: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_stats';

-- Monthly department summary (for billing)
CREATE MATERIALIZED VIEW mv_department_monthly AS
SELECT
    department_id,
    DATE_TRUNC('month', scheduled_date) as month,
    COUNT(*) as trip_count,
    COALESCE(SUM(actual_km), 0) as total_km,
    COALESCE(AVG(actual_km), 0) as avg_km_per_trip
FROM bookings
WHERE status = 'COMPLETED'
  AND scheduled_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months'
GROUP BY department_id, DATE_TRUNC('month', scheduled_date);

CREATE UNIQUE INDEX idx_mv_dept_monthly ON mv_department_monthly(department_id, month);

COMMENT ON MATERIALIZED VIEW mv_department_monthly IS 'Monthly department usage for billing. Refresh monthly.';

-- ============================================================================
-- 6. Function to Refresh Materialized Views
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_department_monthly;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_dashboard_stats IS 'Refresh all dashboard materialized views. Call via pg_cron or application scheduler.';

-- ============================================================================
-- 7. Index Health Check View
-- ============================================================================

CREATE OR REPLACE VIEW v_index_usage AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 50 THEN 'RARELY_USED'
        ELSE 'ACTIVE'
    END as usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

COMMENT ON VIEW v_index_usage IS 'Monitor index usage to identify unused indexes';

-- ============================================================================
-- 8. Table Bloat Estimation View
-- ============================================================================

CREATE OR REPLACE VIEW v_table_bloat AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    CASE
        WHEN n_live_tup > 0
        THEN round(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
        ELSE 0
    END as dead_pct,
    last_vacuum,
    last_autovacuum,
    last_analyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

COMMENT ON VIEW v_table_bloat IS 'Monitor table bloat and vacuum status';
