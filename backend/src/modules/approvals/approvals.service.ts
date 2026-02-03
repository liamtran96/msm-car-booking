import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { BookingApproval } from './entities/booking-approval.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import {
  ApprovalStatus,
  ApprovalType,
  BookingStatus,
  UserSegment,
  MANAGEMENT_LEVELS,
  NotificationType,
} from '../../common/enums';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(BookingApproval)
    private readonly approvalRepository: Repository<BookingApproval>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Determine the approval type based on user segment and position level
   */
  determineApprovalType(user: User, isBusinessTrip: boolean): ApprovalType {
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
   * Create an approval record for a booking
   */
  async createApproval(
    booking: Booking,
    requester: User,
    approvalType: ApprovalType,
  ): Promise<BookingApproval | null> {
    // Auto-approved doesn't need an approval record
    if (approvalType === ApprovalType.AUTO_APPROVED) {
      return null;
    }

    // Check if requester has a manager
    if (!requester.managerId) {
      throw new BadRequestException(
        'User does not have a manager assigned for approval workflow',
      );
    }

    const approval = this.approvalRepository.create({
      bookingId: booking.id,
      approverId: requester.managerId,
      requesterId: requester.id,
      approvalType,
      status:
        approvalType === ApprovalType.CC_ONLY
          ? ApprovalStatus.AUTO_APPROVED
          : ApprovalStatus.PENDING,
      expiresAt:
        approvalType === ApprovalType.MANAGER_APPROVAL
          ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          : null,
    });

    const savedApproval = await this.approvalRepository.save(approval);

    // Send notification to manager
    await this.sendApprovalNotification(requester, booking, approvalType);

    return savedApproval;
  }

  /**
   * Create an approval record within a transaction
   * Used when creating booking and approval atomically
   */
  async createApprovalWithManager(
    booking: Booking,
    requester: User,
    approvalType: ApprovalType,
    manager: EntityManager,
  ): Promise<BookingApproval | null> {
    // Auto-approved doesn't need an approval record
    if (approvalType === ApprovalType.AUTO_APPROVED) {
      return null;
    }

    // Check if requester has a manager
    if (!requester.managerId) {
      throw new BadRequestException(
        'User does not have a manager assigned for approval workflow',
      );
    }

    const approval = manager.create(BookingApproval, {
      bookingId: booking.id,
      approverId: requester.managerId,
      requesterId: requester.id,
      approvalType,
      status:
        approvalType === ApprovalType.CC_ONLY
          ? ApprovalStatus.AUTO_APPROVED
          : ApprovalStatus.PENDING,
      expiresAt:
        approvalType === ApprovalType.MANAGER_APPROVAL
          ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          : null,
    });

    const savedApproval = await manager.save(approval);

    // Send notification to manager (outside transaction to avoid blocking)
    // Using setImmediate to not block the transaction
    setImmediate(() => {
      void this.sendApprovalNotification(requester, booking, approvalType);
    });

    return savedApproval;
  }

  /**
   * Send notification to manager based on approval type
   */
  private async sendApprovalNotification(
    requester: User,
    booking: Booking,
    approvalType: ApprovalType,
  ): Promise<void> {
    if (!requester.managerId) return;

    if (approvalType === ApprovalType.CC_ONLY) {
      // CC notification - info only, no action required
      await this.notificationsService.create({
        userId: requester.managerId,
        bookingId: booking.id,
        notificationType: NotificationType.BOOKING_CC_NOTIFICATION,
        title: 'Booking CC Notification',
        message: `${requester.fullName} has created a business trip booking (${booking.bookingCode}). No action required.`,
      });
    } else if (approvalType === ApprovalType.MANAGER_APPROVAL) {
      // Approval required - action needed
      await this.notificationsService.create({
        userId: requester.managerId,
        bookingId: booking.id,
        notificationType: NotificationType.APPROVAL_REQUIRED,
        title: 'Approval Required',
        message: `${requester.fullName} has requested your approval for booking ${booking.bookingCode}. Please review and respond.`,
      });
    }
  }

  /**
   * Get pending approvals for a manager
   */
  async getPendingForApprover(approverId: string): Promise<BookingApproval[]> {
    return this.approvalRepository.find({
      where: {
        approverId,
        status: ApprovalStatus.PENDING,
      },
      relations: ['booking', 'requester', 'booking.department'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get approval requests created by a user
   */
  async getMyRequests(requesterId: string): Promise<BookingApproval[]> {
    return this.approvalRepository.find({
      where: { requesterId },
      relations: ['booking', 'approver'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get approval by ID
   */
  async findById(id: string): Promise<BookingApproval> {
    const approval = await this.approvalRepository.findOne({
      where: { id },
      relations: ['booking', 'approver', 'requester', 'booking.department'],
    });
    if (!approval) {
      throw new NotFoundException(`Approval with ID ${id} not found`);
    }
    return approval;
  }

  /**
   * Get approval by booking ID
   */
  async findByBookingId(bookingId: string): Promise<BookingApproval | null> {
    return this.approvalRepository.findOne({
      where: { bookingId },
      relations: ['approver', 'requester'],
    });
  }

  /**
   * Approve a booking request
   */
  async approve(
    approvalId: string,
    approverId: string,
    notes?: string,
  ): Promise<BookingApproval> {
    const approval = await this.findById(approvalId);

    // Verify the approver is the correct manager
    if (approval.approverId !== approverId) {
      throw new ForbiddenException(
        'You are not authorized to approve this request',
      );
    }

    // Check if already responded
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('This approval has already been processed');
    }

    // Update approval
    approval.status = ApprovalStatus.APPROVED;
    approval.notes = notes ?? null;
    approval.respondedAt = new Date();

    await this.approvalRepository.save(approval);

    // Update booking status to PENDING (move from PENDING_APPROVAL)
    await this.bookingRepository.update(approval.bookingId, {
      status: BookingStatus.PENDING,
    });

    return approval;
  }

  /**
   * Reject a booking request
   */
  async reject(
    approvalId: string,
    approverId: string,
    notes?: string,
  ): Promise<BookingApproval> {
    const approval = await this.findById(approvalId);

    // Verify the approver is the correct manager
    if (approval.approverId !== approverId) {
      throw new ForbiddenException(
        'You are not authorized to reject this request',
      );
    }

    // Check if already responded
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('This approval has already been processed');
    }

    // Update approval
    approval.status = ApprovalStatus.REJECTED;
    approval.notes = notes ?? null;
    approval.respondedAt = new Date();

    await this.approvalRepository.save(approval);

    // Update booking status to CANCELLED
    await this.bookingRepository.update(approval.bookingId, {
      status: BookingStatus.CANCELLED,
    });

    return approval;
  }

  /**
   * Get expired approvals that need to be processed
   */
  async getExpiredApprovals(): Promise<BookingApproval[]> {
    return this.approvalRepository
      .createQueryBuilder('approval')
      .where('approval.status = :status', { status: ApprovalStatus.PENDING })
      .andWhere('approval.expires_at < :now', { now: new Date() })
      .getMany();
  }

  /**
   * Mark approval as expired
   */
  async markAsExpired(approvalId: string): Promise<void> {
    await this.approvalRepository.update(approvalId, {
      status: ApprovalStatus.EXPIRED,
    });
  }

  /**
   * Get approvals needing reminder (pending for more than 4 hours, less than 3 reminders)
   */
  async getApprovalsNeedingReminder(): Promise<BookingApproval[]> {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    return this.approvalRepository
      .createQueryBuilder('approval')
      .where('approval.status = :status', { status: ApprovalStatus.PENDING })
      .andWhere('approval.reminder_count < :maxReminders', { maxReminders: 3 })
      .andWhere('approval.created_at < :fourHoursAgo', { fourHoursAgo })
      .andWhere(
        '(approval.last_reminder_at IS NULL OR approval.last_reminder_at < :oneHourAgo)',
        { oneHourAgo: new Date(Date.now() - 60 * 60 * 1000) },
      )
      .getMany();
  }

  /**
   * Increment reminder count
   */
  async incrementReminderCount(approvalId: string): Promise<void> {
    await this.approvalRepository
      .createQueryBuilder()
      .update(BookingApproval)
      .set({
        reminderCount: () => 'reminder_count + 1',
        lastReminderAt: new Date(),
      })
      .where('id = :id', { id: approvalId })
      .execute();
  }
}
