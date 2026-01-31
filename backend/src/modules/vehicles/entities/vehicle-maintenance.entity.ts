import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MaintenanceType } from '../../../common/enums';
import { Vehicle } from './vehicle.entity';
import { User } from '../../users/entities/user.entity';

/**
 * VehicleMaintenance Entity
 * Service and repair history for vehicles.
 * Tracks maintenance schedules and costs.
 */
@Entity('vehicle_maintenance')
export class VehicleMaintenance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'maintenance_type', type: 'enum', enum: MaintenanceType })
  maintenanceType: MaintenanceType;

  @Column({ type: 'text' })
  description: string;

  /** Odometer reading when service was performed */
  @Column({
    name: 'odometer_at_service',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  odometerAtService: number;

  /** Total cost of maintenance */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cost: number;

  @Column({ name: 'vendor_name', nullable: true })
  vendorName: string;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  /** Trigger next service at this odometer reading */
  @Column({
    name: 'next_service_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  nextServiceKm: number;

  /** Time-based service reminder date */
  @Column({ name: 'next_service_date', type: 'date', nullable: true })
  nextServiceDate: Date;

  @Column({ name: 'performed_by', nullable: true })
  performedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performed_by' })
  performedBy: User;
}
