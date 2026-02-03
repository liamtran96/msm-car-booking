import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ScheduleChangeDto } from './dto/schedule-change.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({ summary: 'Get all chat rooms for current user' })
  @ApiResponse({ status: 200, description: 'List of chat rooms' })
  getRooms(@Request() req: { user: { id: string } }) {
    return this.chatService.getRoomsForUser(req.user.id);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Get chat room by ID' })
  @ApiResponse({ status: 200, description: 'Chat room details' })
  @ApiResponse({ status: 404, description: 'Chat room not found' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  getRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.chatService.getRoomById(id, req.user.id);
  }

  @Get('rooms/booking/:bookingId')
  @ApiOperation({ summary: 'Get or create chat room for a booking' })
  @ApiResponse({ status: 200, description: 'Chat room details' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  getRoomByBooking(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.chatService.getOrCreateRoomForBooking(bookingId, req.user.id);
  }

  @Get('rooms/:id/messages')
  @ApiOperation({ summary: 'Get messages for a chat room' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of messages' })
  getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.chatService.getMessages(
      id,
      req.user.id,
      limit || 50,
      offset || 0,
    );
  }

  @Post('rooms/:id/messages')
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMessageDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.chatService.sendMessage(id, req.user.id, dto);
  }

  @Post('rooms/:id/schedule-change')
  @ApiOperation({ summary: 'Send a schedule change notification' })
  @ApiResponse({ status: 201, description: 'Schedule change sent' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  sendScheduleChange(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleChangeDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.chatService.sendScheduleChange(id, req.user.id, dto);
  }

  @Post('rooms/:id/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.chatService.markAsRead(id, req.user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@Request() req: { user: { id: string } }) {
    const count = await this.chatService.getUnreadCount(req.user.id);
    return { count };
  }
}
