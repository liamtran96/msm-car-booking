import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

/**
 * KmQuota Entity
 * Monthly kilometer quotas per vehicle for cost control.
 * Used to trigger external dispatch when quota exceeded.
 */
@Entity('km_quotas')
@Unique(['vehicleId', 'month'])
export class KmQuota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  /** First day of month this quota applies to (e.g., 2026-01-01) */
  @Column({ type: 'date' })
  month: Date;

  /** Maximum allowed KM for the month */
  @Column({ name: 'quota_km', type: 'decimal', precision: 10, scale: 2 })
  quotaKm: number;

  /** Buffer KM allowed over quota before external dispatch */
  @Column({
    name: 'tolerance_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  toleranceKm: number;

  /** Cumulative KM used, auto-updated on trip completion */
  @Column({
    name: 'used_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  usedKm: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
