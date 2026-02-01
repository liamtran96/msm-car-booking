import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { DriverShiftsService } from './driver-shifts.service';
import {
  CreateDriverShiftDto,
  UpdateDriverShiftDto,
  DriverShiftFilterDto,
  DriverShiftResponseDto,
} from './dto/driver-shift.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { User } from './entities/user.entity';

@ApiTags('driver-shifts')
@Controller('driver-shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DriverShiftsController {
  constructor(private readonly driverShiftsService: DriverShiftsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: 'Create a driver shift (Admin, PIC)' })
  @ApiResponse({
    status: 201,
    description: 'Shift created',
    type: DriverShiftResponseDto,
  })
  create(
    @Body() createDto: CreateDriverShiftDto,
  ): Promise<DriverShiftResponseDto> {
    return this.driverShiftsService.create(createDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: 'Get all driver shifts with filters (Admin, PIC)' })
  findAll(
    @Query() filterDto: DriverShiftFilterDto,
  ): Promise<DriverShiftResponseDto[]> {
    return this.driverShiftsService.findAll(filterDto);
  }

  @Get('today')
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: "Get today's shifts (Admin, PIC)" })
  findTodayShifts(): Promise<DriverShiftResponseDto[]> {
    return this.driverShiftsService.findTodayShifts();
  }

  @Get('available')
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: 'Get available drivers for date/time (Admin, PIC)' })
  @ApiQuery({ name: 'date', required: true, description: 'Date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'time', required: true, description: 'Time (HH:mm)' })
  findAvailableDrivers(
    @Query('date') date: string,
    @Query('time') time: string,
  ): Promise<DriverShiftResponseDto[]> {
    return this.driverShiftsService.findAvailableDriversForTime(date, time);
  }

  @Get('my-shifts')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: "Get current driver's shifts (Driver only)" })
  findMyShifts(@CurrentUser() user: User): Promise<DriverShiftResponseDto[]> {
    return this.driverShiftsService.findByDriverId(user.id);
  }

  @Get('driver/:driverId')
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: 'Get shifts by driver ID (Admin, PIC)' })
  findByDriverId(
    @Param('driverId', ParseUUIDPipe) driverId: string,
  ): Promise<DriverShiftResponseDto[]> {
    return this.driverShiftsService.findByDriverId(driverId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PIC, UserRole.DRIVER)
  @ApiOperation({ summary: 'Get shift by ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DriverShiftResponseDto> {
    return this.driverShiftsService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: 'Update shift (Admin, PIC)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateDriverShiftDto,
  ): Promise<DriverShiftResponseDto> {
    return this.driverShiftsService.update(id, updateDto);
  }

  @Patch(':id/start')
  @Roles(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start shift (Driver only)' })
  startShift(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<DriverShiftResponseDto> {
    return this.driverShiftsService.startShift(id, user.id);
  }

  @Patch(':id/end')
  @Roles(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End shift (Driver only)' })
  endShift(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<DriverShiftResponseDto> {
    return this.driverShiftsService.endShift(id, user.id);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel shift (Admin, PIC)' })
  cancelShift(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DriverShiftResponseDto> {
    return this.driverShiftsService.cancelShift(id);
  }

  @Patch(':id/absent')
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark shift as absent (Admin, PIC)' })
  markAbsent(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DriverShiftResponseDto> {
    return this.driverShiftsService.markAbsent(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete shift (Admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.driverShiftsService.remove(id);
  }
}
