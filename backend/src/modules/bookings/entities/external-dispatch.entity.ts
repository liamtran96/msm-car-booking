import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExternalProvider } from '../../../common/enums';
import { Booking } from './booking.entity';

/**
 * ExternalDispatch Entity
 * External provider bookings when internal fleet unavailable.
 * Tracks Grab, Taxi, etc. when internal vehicles not available.
 */
@Entity('external_dispatches')
export class ExternalDispatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  /** GRAB, TAXI_MAI_LINH, etc. */
  @Column({ type: 'enum', enum: ExternalProvider })
  provider: ExternalProvider;

  /** Reference number from Grab/Taxi provider */
  @Column({ name: 'provider_booking_id', nullable: true })
  providerBookingId: string;

  @Column({ name: 'provider_driver_name', nullable: true })
  providerDriverName: string;

  /** Quoted cost */
  @Column({
    name: 'estimated_cost',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  estimatedCost: number;

  /** Final billed cost */
  @Column({
    name: 'actual_cost',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  actualCost: number;

  /** Reason: quota exceeded, no vehicle, no driver, etc. */
  @Column({ name: 'dispatch_reason', type: 'text', nullable: true })
  dispatchReason: string;

  @Column({
    name: 'dispatched_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  dispatchedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;
}
