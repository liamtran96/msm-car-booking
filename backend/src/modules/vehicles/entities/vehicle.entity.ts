import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { VehicleType, VehicleStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';

@Entity('vehicles')
@Index('idx_vehicles_status_active', ['status', 'isActive'])
@Index('idx_vehicles_driver', ['assignedDriverId'])
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'license_plate', unique: true })
  licensePlate: string;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column({ nullable: true })
  year: number;

  @Column()
  capacity: number;

  @Column({ name: 'vehicle_type', type: 'enum', enum: VehicleType })
  vehicleType: VehicleType;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
  })
  status: VehicleStatus;

  @Column({
    name: 'current_odometer_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  currentOdometerKm: number;

  @Column({ name: 'gps_device_id', nullable: true })
  gpsDeviceId: string;

  @Column({ name: 'assigned_driver_id', nullable: true })
  assignedDriverId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_driver_id' })
  assignedDriver: User;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
