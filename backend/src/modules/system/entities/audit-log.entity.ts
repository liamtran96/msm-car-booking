import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * AuditLog Entity
 * Compliance audit trail for critical data changes.
 * Records old/new values for compliance.
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Table that was changed */
  @Column({ name: 'table_name', length: 100 })
  tableName: string;

  /** Primary key of changed record */
  @Column({ name: 'record_id', type: 'uuid' })
  recordId: string;

  /** INSERT, UPDATE, DELETE */
  @Column({ length: 20 })
  action: string;

  /** Previous values (NULL for INSERT) */
  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: Record<string, unknown>;

  /** New values (NULL for DELETE) */
  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: Record<string, unknown>;

  /** List of columns that changed in this operation */
  @Column({ name: 'changed_fields', type: 'text', array: true, nullable: true })
  changedFields: string[];

  @Column({ name: 'changed_by', nullable: true })
  changedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedBy: User;

  @Column({
    name: 'changed_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  changedAt: Date;
}
