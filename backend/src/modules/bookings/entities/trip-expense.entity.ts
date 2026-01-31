import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExpenseType } from '../../../common/enums';
import { Booking } from './booking.entity';
import { User } from '../../users/entities/user.entity';

/**
 * TripExpense Entity
 * Driver-recorded trip expenses with approval workflow.
 * Supports receipt upload and approval workflow.
 */
@Entity('trip_expenses')
export class TripExpense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  /** TOLL, PARKING, FUEL, etc. */
  @Column({ name: 'expense_type', type: 'enum', enum: ExpenseType })
  expenseType: ExpenseType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  /** Cloud storage URL for receipt image verification */
  @Column({ name: 'receipt_url', length: 500, nullable: true })
  receiptUrl: string;

  @Column({ name: 'recorded_by' })
  recordedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recorded_by' })
  recordedBy: User;

  @Column({
    name: 'recorded_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  recordedAt: Date;

  @Column({ name: 'approved_by', nullable: true })
  approvedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date;

  /** Approval status: NULL=pending, true=approved, false=rejected */
  @Column({ name: 'is_approved', nullable: true })
  isApproved: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
