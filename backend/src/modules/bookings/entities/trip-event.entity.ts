import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TripEventType } from '../../../common/enums';
import { Booking } from './booking.entity';
import { User } from '../../users/entities/user.entity';

/**
 * TripEvent Entity
 * Chronological timeline of trip execution events.
 * Powers the driver app activity feed.
 */
@Entity('trip_events')
export class TripEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'event_type', type: 'enum', enum: TripEventType })
  eventType: TripEventType;

  /** JSON payload: {stop_id, expense_id, call_duration, etc.} */
  @Column({ name: 'event_data', type: 'jsonb', nullable: true })
  eventData: Record<string, unknown>;

  /** GPS location when event occurred */
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ name: 'recorded_by', nullable: true })
  recordedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'recorded_by' })
  recordedBy: User;

  @Column({
    name: 'recorded_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  recordedAt: Date;
}
