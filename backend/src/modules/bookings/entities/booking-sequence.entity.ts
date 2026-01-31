import { Entity, PrimaryColumn, Column } from 'typeorm';

/**
 * BookingSequence Entity
 * Atomic sequence generator for booking codes (MSM-YYYYMMDD-XXXX).
 * Prevents race conditions when generating sequential codes.
 */
@Entity('booking_sequences')
export class BookingSequence {
  /** Date portion of booking code */
  @PrimaryColumn({ name: 'date_key', type: 'date' })
  dateKey: Date;

  /** Last assigned sequence, incremented atomically */
  @Column({ name: 'last_seq', default: 0 })
  lastSeq: number;
}
