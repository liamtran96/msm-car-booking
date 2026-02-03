import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { RespondApprovalDto } from './dto/respond-approval.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApprovalStatus, UserRole } from '../../common/enums';

@ApiTags('approvals')
@Controller('approvals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  @ApiOperation({
    summary: 'Get pending approvals for current user (as approver)',
  })
  @ApiResponse({ status: 200, description: 'List of pending approvals' })
  getPendingApprovals(@Request() req: { user: { id: string } }) {
    return this.approvalsService.getPendingForApprover(req.user.id);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Get approval requests created by current user' })
  @ApiResponse({ status: 200, description: 'List of approval requests' })
  getMyRequests(@Request() req: { user: { id: string } }) {
    return this.approvalsService.getMyRequests(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get approval details by ID' })
  @ApiResponse({ status: 200, description: 'Approval details' })
  @ApiResponse({ status: 403, description: 'Not authorized to view' })
  @ApiResponse({ status: 404, description: 'Approval not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string; role: UserRole } },
  ) {
    const approval = await this.approvalsService.findById(id);

    // Check authorization: user must be approver, requester, or admin
    const isAuthorized =
      approval.approverId === req.user.id ||
      approval.requesterId === req.user.id ||
      req.user.role === UserRole.ADMIN;

    if (!isAuthorized) {
      throw new ForbiddenException(
        'You are not authorized to view this approval',
      );
    }

    return approval;
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get approval by booking ID' })
  @ApiResponse({ status: 200, description: 'Approval details' })
  @ApiResponse({ status: 403, description: 'Not authorized to view' })
  async findByBooking(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Request() req: { user: { id: string; role: UserRole } },
  ) {
    const approval = await this.approvalsService.findByBookingId(bookingId);

    if (!approval) {
      return null;
    }

    // Check authorization: user must be approver, requester, or admin
    const isAuthorized =
      approval.approverId === req.user.id ||
      approval.requesterId === req.user.id ||
      req.user.role === UserRole.ADMIN;

    if (!isAuthorized) {
      throw new ForbiddenException(
        'You are not authorized to view this approval',
      );
    }

    return approval;
  }

  @Post(':id/respond')
  @ApiOperation({
    summary: 'Respond to an approval request (approve or reject)',
  })
  @ApiResponse({ status: 200, description: 'Response recorded successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to respond' })
  @ApiResponse({ status: 400, description: 'Already processed' })
  async respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondApprovalDto,
    @Request() req: { user: { id: string } },
  ) {
    if (dto.decision === ApprovalStatus.APPROVED) {
      return this.approvalsService.approve(id, req.user.id, dto.notes);
    }
    return this.approvalsService.reject(id, req.user.id, dto.notes);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a booking request' })
  @ApiResponse({ status: 200, description: 'Approval approved successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to approve' })
  @ApiResponse({ status: 400, description: 'Already processed' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { notes?: string },
    @Request() req: { user: { id: string } },
  ) {
    return this.approvalsService.approve(id, req.user.id, dto.notes);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a booking request' })
  @ApiResponse({ status: 200, description: 'Approval rejected successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to reject' })
  @ApiResponse({ status: 400, description: 'Already processed' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { notes?: string },
    @Request() req: { user: { id: string } },
  ) {
    return this.approvalsService.reject(id, req.user.id, dto.notes);
  }
}
