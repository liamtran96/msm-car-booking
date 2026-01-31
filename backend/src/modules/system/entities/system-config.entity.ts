import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * SystemConfig Entity
 * Application settings stored as JSONB key-value pairs.
 * Key-value store with JSONB values for flexible configuration.
 */
@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Dot-notation config key: "booking.max_advance_days" */
  @Column({ unique: true, length: 100 })
  key: string;

  /** JSON value: {"enabled": true, "threshold": 100} */
  @Column({ type: 'jsonb' })
  value: Record<string, unknown>;

  /** Human-readable description */
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
