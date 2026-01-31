import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PointType } from '../../../common/enums';

/**
 * PickupPoint Entity
 * Predefined company locations and user-defined custom points.
 * Used as reference for trip stops.
 */
@Entity('pickup_points')
export class PickupPoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Location name: "HQ Office", "Factory A" */
  @Column()
  name: string;

  /** Full address */
  @Column({ length: 500 })
  address: string;

  /** GPS latitude (-90 to 90) */
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  /** GPS longitude (-180 to 180) */
  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  /** FIXED=company location, FLEXIBLE=user-defined */
  @Column({ name: 'point_type', type: 'enum', enum: PointType })
  pointType: PointType;

  /** Soft delete flag */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
