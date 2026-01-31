import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReadingType } from '../../../common/enums';
import { Vehicle } from './vehicle.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';

/**
 * OdometerLog Entity
 * Odometer readings for KM tracking and quota management.
 * Used for quota tracking and fraud detection.
 */
@Entity('odometer_logs')
export class OdometerLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'booking_id', nullable: true })
  bookingId: string;

  @ManyToOne(() => Booking, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  /** Odometer value in KM */
  @Column({ name: 'reading_km', type: 'decimal', precision: 10, scale: 2 })
  readingKm: number;

  /** Context: at trip start, end, or daily inspection */
  @Column({ name: 'reading_type', type: 'enum', enum: ReadingType })
  readingType: ReadingType;

  @Column({
    name: 'recorded_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  recordedAt: Date;

  @Column({ name: 'recorded_by' })
  recordedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recorded_by' })
  recordedBy: User;

  /** Photo of odometer (optional) */
  @Column({ name: 'photo_url', length: 500, nullable: true })
  photoUrl: string;

  /** Admin verification flag for suspicious readings */
  @Column({ name: 'is_validated', default: false })
  isValidated: boolean;

  @Column({ name: 'validation_notes', type: 'text', nullable: true })
  validationNotes: string;
}
