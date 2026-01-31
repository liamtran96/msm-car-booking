import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StopType } from '../../../common/enums';
import { Booking } from './booking.entity';
import { PickupPoint } from '../../locations/entities/pickup-point.entity';

/**
 * TripStop Entity
 * Ordered stops within a booking, minimum 2 (pickup + drop).
 * Each booking has at least PICKUP and DROP stops.
 */
@Entity('trip_stops')
export class TripStop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  /** Reference to predefined location, NULL for custom */
  @Column({ name: 'pickup_point_id', nullable: true })
  pickupPointId: string;

  @ManyToOne(() => PickupPoint, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'pickup_point_id' })
  pickupPoint: PickupPoint;

  /** Free-text address when not using predefined point */
  @Column({ name: 'custom_address', length: 500, nullable: true })
  customAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  /** Sequence number: 1=first stop, 2=second, etc. */
  @Column({ name: 'stop_order' })
  stopOrder: number;

  /** PICKUP, DROP, or STOP (intermediate) */
  @Column({ name: 'stop_type', type: 'enum', enum: StopType })
  stopType: StopType;

  /** Expected arrival time */
  @Column({ name: 'scheduled_time', type: 'time', nullable: true })
  scheduledTime: string;

  /** When driver actually arrived */
  @Column({ name: 'actual_arrival', type: 'timestamptz', nullable: true })
  actualArrival: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
