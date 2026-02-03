import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { BookingSequence } from './entities/booking-sequence.entity';
import { User } from '../users/entities/user.entity';
import {
  BookingStatus,
  BookingType,
  ApprovalType,
  MANAGEMENT_LEVELS,
  UserSegment,
} from '../../common/enums';
import { ApprovalsService } from '../approvals/approvals.service';
import { ChatService } from '../chat/chat.service';

export interface CreateBookingData {
  requesterId: string;
  departmentId?: string;
  bookingType: BookingType;
  scheduledDate: Date;
  scheduledTime: string;
  endDate?: Date;
  purpose?: string;
  passengerCount: number;
  notes?: string;
  estimatedKm?: number;
  isBusinessTrip?: boolean;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(BookingSequence)
    private readonly sequenceRepository: Repository<BookingSequence>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => ApprovalsService))
    private readonly approvalsService: ApprovalsService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  async findAll(): Promise<Booking[]> {
    return this.bookingRepository.find({
      relations: [
        'requester',
        'department',
        'assignedVehicle',
        'assignedDriver',
      ],
      order: { scheduledDate: 'DESC', scheduledTime: 'DESC' },
    });
  }

  async findById(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: [
        'requester',
        'department',
        'assignedVehicle',
        'assignedDriver',
      ],
    });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async findByStatus(status: BookingStatus): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { status },
      relations: [
        'requester',
        'department',
        'assignedVehicle',
        'assignedDriver',
      ],
      order: { scheduledDate: 'ASC', scheduledTime: 'ASC' },
    });
  }

  async findByDriver(driverId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { assignedDriverId: driverId },
      relations: ['requester', 'department', 'assignedVehicle'],
      order: { scheduledDate: 'DESC', scheduledTime: 'DESC' },
    });
  }

  /**
   * Determine the approval type for a booking based on user segment and position
   */
  private determineApprovalType(
    user: User,
    isBusinessTrip: boolean,
  ): ApprovalType {
    // Rule 1: Management level (MGR+) -> Auto-approved
    if (MANAGEMENT_LEVELS.includes(user.positionLevel)) {
      return ApprovalType.AUTO_APPROVED;
    }

    // Rule 2: SIC (DAILY segment) with business trips -> CC only
    if (user.userSegment === UserSegment.DAILY && isBusinessTrip) {
      return ApprovalType.CC_ONLY;
    }

    // Rule 3: All others -> Manager approval required
    return ApprovalType.MANAGER_APPROVAL;
  }

  /**
   * Create a new booking with approval workflow
   * Uses database transaction to ensure atomicity
   */
  async createBooking(data: CreateBookingData): Promise<Booking> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      // Get the requester user
      const requester = await manager.findOne(User, {
        where: { id: data.requesterId },
      });

      if (!requester) {
        throw new NotFoundException(
          `User with ID ${data.requesterId} not found`,
        );
      }

      // Determine approval type
      const isBusinessTrip = data.isBusinessTrip ?? true;
      const approvalType = this.determineApprovalType(
        requester,
        isBusinessTrip,
      );

      // Determine initial status based on approval type
      const initialStatus =
        approvalType === ApprovalType.MANAGER_APPROVAL
          ? BookingStatus.PENDING_APPROVAL
          : BookingStatus.PENDING;

      // Generate booking code atomically within transaction
      const bookingCode = await this.generateBookingCode(
        data.scheduledDate,
        manager,
      );

      // Create booking
      const booking = manager.create(Booking, {
        ...data,
        approvalType,
        isBusinessTrip,
        status: initialStatus,
        bookingCode,
      });

      const savedBooking = await manager.save(booking);

      // Create approval record if needed (within same transaction)
      if (approvalType !== ApprovalType.AUTO_APPROVED) {
        await this.approvalsService.createApprovalWithManager(
          savedBooking,
          requester,
          approvalType,
          manager,
        );
      }

      return savedBooking;
    });
  }

  /**
   * Generate a unique booking code using atomic sequence
   * Uses INSERT ... ON CONFLICT to ensure thread-safe sequence generation
   */
  private async generateBookingCode(
    scheduledDate: Date,
    manager: EntityManager,
  ): Promise<string> {
    const dateStr = scheduledDate.toISOString().slice(0, 10).replace(/-/g, '');
    const dateKey = scheduledDate.toISOString().slice(0, 10);

    // Atomic upsert: insert new sequence or increment existing
    // Uses PostgreSQL's INSERT ... ON CONFLICT ... RETURNING for atomicity
    const result = await manager.query<{ last_seq: number }[]>(
      `INSERT INTO booking_sequences (date_key, last_seq)
       VALUES ($1, 1)
       ON CONFLICT (date_key)
       DO UPDATE SET last_seq = booking_sequences.last_seq + 1
       RETURNING last_seq`,
      [dateKey],
    );

    const sequence = String(result[0].last_seq).padStart(4, '0');
    return `MSM-${dateStr}-${sequence}`;
  }

  /**
   * Assign a driver to a booking and create chat room for BLOCK_SCHEDULE
   */
  async assignDriver(bookingId: string, driverId: string): Promise<Booking> {
    const booking = await this.findById(bookingId);

    booking.assignedDriverId = driverId;
    booking.status = BookingStatus.ASSIGNED;

    const updatedBooking = await this.bookingRepository.save(booking);

    // Create chat room for BLOCK_SCHEDULE bookings
    if (updatedBooking.bookingType === BookingType.BLOCK_SCHEDULE) {
      await this.chatService.onDriverAssigned(updatedBooking);
    }

    return updatedBooking;
  }

  /**
   * Update booking status
   */
  async updateStatus(
    bookingId: string,
    status: BookingStatus,
  ): Promise<Booking> {
    const booking = await this.findById(bookingId);
    booking.status = status;

    // Handle chat room status changes
    if (status === BookingStatus.COMPLETED) {
      await this.chatService.archiveRoom(bookingId);
    } else if (status === BookingStatus.CANCELLED) {
      await this.chatService.closeRoom(bookingId);
    }

    return this.bookingRepository.save(booking);
  }
}
