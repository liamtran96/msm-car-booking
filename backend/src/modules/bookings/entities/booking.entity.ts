import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BookingType, BookingStatus, CancellationReason } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Department } from '../../departments/entities/department.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_code', unique: true })
  bookingCode: string;

  @Column({ name: 'requester_id' })
  requesterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'booking_type', type: 'enum', enum: BookingType })
  bookingType: BookingType;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ name: 'scheduled_date', type: 'date' })
  scheduledDate: Date;

  @Column({ name: 'scheduled_time', type: 'time' })
  scheduledTime: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'text', nullable: true })
  purpose: string;

  @Column({ name: 'passenger_count' })
  passengerCount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'assigned_vehicle_id', nullable: true })
  assignedVehicleId: string;

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'assigned_vehicle_id' })
  assignedVehicle: Vehicle;

  @Column({ name: 'assigned_driver_id', nullable: true })
  assignedDriverId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_driver_id' })
  assignedDriver: User;

  @Column({ name: 'estimated_km', type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedKm: number;

  @Column({ name: 'actual_km', type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualKm: number;

  @Column({ name: 'cancelled_at', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'cancelled_by', nullable: true })
  cancelledById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cancelled_by' })
  cancelledBy: User;

  @Column({ name: 'cancellation_reason', type: 'enum', enum: CancellationReason, nullable: true })
  cancellationReason: CancellationReason;

  @Column({ name: 'cancellation_notes', type: 'text', nullable: true })
  cancellationNotes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
