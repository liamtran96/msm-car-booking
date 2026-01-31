import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Booking } from './booking.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { User } from '../../users/entities/user.entity';
import { Department } from '../../departments/entities/department.entity';

/**
 * TripReport Entity
 * Denormalized completed trip data for analytics dashboards.
 * Pre-aggregated for fast dashboard queries.
 */
@Entity('trip_reports')
export class TripReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', unique: true })
  bookingId: string;

  @OneToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'vehicle_id', nullable: true })
  vehicleId: string;

  @ManyToOne(() => Vehicle, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'driver_id', nullable: true })
  driverId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @Column({ name: 'requester_id', nullable: true })
  requesterId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'trip_date', type: 'date' })
  tripDate: Date;

  @Column({
    name: 'start_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  startKm: number;

  @Column({
    name: 'end_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  endKm: number;

  @Column({
    name: 'total_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  totalKm: number;

  @Column({ name: 'duration_minutes', nullable: true })
  durationMinutes: number;

  /** Calculated trip cost */
  @Column({
    name: 'cost_estimate',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  costEstimate: number;

  /** Sum of approved expenses */
  @Column({
    name: 'total_expenses',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalExpenses: number;

  /** JSON breakdown by expense type: {TOLL: 50, FUEL: 100} */
  @Column({ name: 'expense_breakdown', type: 'jsonb', nullable: true })
  expenseBreakdown: Record<string, number>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
