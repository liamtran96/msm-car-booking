import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverShift } from './entities/driver-shift.entity';
import { User } from './entities/user.entity';
import {
  CreateDriverShiftDto,
  UpdateDriverShiftDto,
  DriverShiftFilterDto,
  DriverShiftResponseDto,
} from './dto/driver-shift.dto';
import { UserRole, ShiftStatus } from '../../common/enums';

@Injectable()
export class DriverShiftsService {
  constructor(
    @InjectRepository(DriverShift)
    private readonly shiftRepository: Repository<DriverShift>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private toResponseDto(shift: DriverShift): DriverShiftResponseDto {
    return {
      id: shift.id,
      driverId: shift.driverId,
      shiftDate: shift.shiftDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
      status: shift.status,
      actualStart: shift.actualStart,
      actualEnd: shift.actualEnd,
      createdAt: shift.createdAt,
      updatedAt: shift.updatedAt,
      driver: shift.driver
        ? {
            id: shift.driver.id,
            email: shift.driver.email,
            fullName: shift.driver.fullName,
            phone: shift.driver.phone,
            role: shift.driver.role,
            userSegment: shift.driver.userSegment,
            departmentId: shift.driver.departmentId,
            department: shift.driver.department,
            isActive: shift.driver.isActive,
            createdAt: shift.driver.createdAt,
            updatedAt: shift.driver.updatedAt,
          }
        : undefined,
    };
  }

  async create(
    createDto: CreateDriverShiftDto,
  ): Promise<DriverShiftResponseDto> {
    const driver = await this.userRepository.findOne({
      where: { id: createDto.driverId, role: UserRole.DRIVER, isActive: true },
    });
    if (!driver) {
      throw new NotFoundException(
        `Active driver with ID ${createDto.driverId} not found`,
      );
    }

    if (createDto.startTime >= createDto.endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const existingShift = await this.shiftRepository.findOne({
      where: {
        driverId: createDto.driverId,
        shiftDate: new Date(createDto.shiftDate),
      },
    });
    if (existingShift) {
      throw new ConflictException(
        'Driver already has a shift scheduled for this date',
      );
    }

    const shift = this.shiftRepository.create({
      ...createDto,
      shiftDate: new Date(createDto.shiftDate),
    });

    const savedShift = await this.shiftRepository.save(shift);
    return this.findById(savedShift.id);
  }

  async findAll(
    filterDto: DriverShiftFilterDto,
  ): Promise<DriverShiftResponseDto[]> {
    const queryBuilder = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.driver', 'driver')
      .leftJoinAndSelect('driver.department', 'department');

    if (filterDto.driverId) {
      queryBuilder.andWhere('shift.driverId = :driverId', {
        driverId: filterDto.driverId,
      });
    }

    if (filterDto.date) {
      queryBuilder.andWhere('shift.shiftDate = :date', {
        date: filterDto.date,
      });
    }

    if (filterDto.dateFrom && filterDto.dateTo) {
      queryBuilder.andWhere('shift.shiftDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom: filterDto.dateFrom,
        dateTo: filterDto.dateTo,
      });
    } else if (filterDto.dateFrom) {
      queryBuilder.andWhere('shift.shiftDate >= :dateFrom', {
        dateFrom: filterDto.dateFrom,
      });
    } else if (filterDto.dateTo) {
      queryBuilder.andWhere('shift.shiftDate <= :dateTo', {
        dateTo: filterDto.dateTo,
      });
    }

    if (filterDto.status) {
      queryBuilder.andWhere('shift.status = :status', {
        status: filterDto.status,
      });
    }

    queryBuilder
      .orderBy('shift.shiftDate', 'ASC')
      .addOrderBy('shift.startTime', 'ASC');

    const shifts = await queryBuilder.getMany();
    return shifts.map((shift) => this.toResponseDto(shift));
  }

  async findById(id: string): Promise<DriverShiftResponseDto> {
    const shift = await this.shiftRepository.findOne({
      where: { id },
      relations: ['driver', 'driver.department'],
    });
    if (!shift) {
      throw new NotFoundException(`Driver shift with ID ${id} not found`);
    }
    return this.toResponseDto(shift);
  }

  async findByDriverId(driverId: string): Promise<DriverShiftResponseDto[]> {
    const shifts = await this.shiftRepository.find({
      where: { driverId },
      relations: ['driver', 'driver.department'],
      order: { shiftDate: 'ASC', startTime: 'ASC' },
    });
    return shifts.map((shift) => this.toResponseDto(shift));
  }

  async findTodayShifts(): Promise<DriverShiftResponseDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const shifts = await this.shiftRepository.find({
      where: { shiftDate: today },
      relations: ['driver', 'driver.department'],
      order: { startTime: 'ASC' },
    });
    return shifts.map((shift) => this.toResponseDto(shift));
  }

  async findAvailableDriversForTime(
    date: string,
    time: string,
  ): Promise<DriverShiftResponseDto[]> {
    const queryBuilder = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.driver', 'driver')
      .leftJoinAndSelect('driver.department', 'department')
      .where('shift.shiftDate = :date', { date })
      .andWhere('shift.startTime <= :time', { time })
      .andWhere('shift.endTime >= :time', { time })
      .andWhere('shift.status IN (:...statuses)', {
        statuses: [ShiftStatus.SCHEDULED, ShiftStatus.ACTIVE],
      })
      .andWhere('driver.isActive = :isActive', { isActive: true });

    const shifts = await queryBuilder.getMany();
    return shifts.map((shift) => this.toResponseDto(shift));
  }

  async update(
    id: string,
    updateDto: UpdateDriverShiftDto,
  ): Promise<DriverShiftResponseDto> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Driver shift with ID ${id} not found`);
    }

    const startTime = updateDto.startTime || shift.startTime;
    const endTime = updateDto.endTime || shift.endTime;
    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    if (updateDto.driverId && updateDto.driverId !== shift.driverId) {
      const driver = await this.userRepository.findOne({
        where: {
          id: updateDto.driverId,
          role: UserRole.DRIVER,
          isActive: true,
        },
      });
      if (!driver) {
        throw new NotFoundException(
          `Active driver with ID ${updateDto.driverId} not found`,
        );
      }
    }

    Object.assign(shift, {
      ...updateDto,
      shiftDate: updateDto.shiftDate
        ? new Date(updateDto.shiftDate)
        : shift.shiftDate,
    });

    await this.shiftRepository.save(shift);
    return this.findById(id);
  }

  async startShift(
    id: string,
    currentUserId?: string,
  ): Promise<DriverShiftResponseDto> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Driver shift with ID ${id} not found`);
    }

    // Add ownership check for drivers
    if (currentUserId && shift.driverId !== currentUserId) {
      throw new ForbiddenException('You can only manage your own shifts');
    }

    if (shift.status !== ShiftStatus.SCHEDULED) {
      throw new BadRequestException(
        `Cannot start shift with status ${shift.status}`,
      );
    }

    shift.status = ShiftStatus.ACTIVE;
    shift.actualStart = new Date();

    await this.shiftRepository.save(shift);
    return this.findById(id);
  }

  async endShift(
    id: string,
    currentUserId?: string,
  ): Promise<DriverShiftResponseDto> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Driver shift with ID ${id} not found`);
    }

    // Add ownership check for drivers
    if (currentUserId && shift.driverId !== currentUserId) {
      throw new ForbiddenException('You can only manage your own shifts');
    }

    if (shift.status !== ShiftStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot end shift with status ${shift.status}`,
      );
    }

    shift.status = ShiftStatus.COMPLETED;
    shift.actualEnd = new Date();

    await this.shiftRepository.save(shift);
    return this.findById(id);
  }

  async cancelShift(id: string): Promise<DriverShiftResponseDto> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Driver shift with ID ${id} not found`);
    }

    if (shift.status === ShiftStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed shift');
    }

    shift.status = ShiftStatus.CANCELLED;
    await this.shiftRepository.save(shift);
    return this.findById(id);
  }

  async markAbsent(id: string): Promise<DriverShiftResponseDto> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Driver shift with ID ${id} not found`);
    }

    if (shift.status !== ShiftStatus.SCHEDULED) {
      throw new BadRequestException(
        `Cannot mark absent a shift with status ${shift.status}`,
      );
    }

    shift.status = ShiftStatus.ABSENT;
    await this.shiftRepository.save(shift);
    return this.findById(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Driver shift with ID ${id} not found`);
    }

    if (shift.status === ShiftStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete an active shift');
    }

    await this.shiftRepository.remove(shift);
    return { message: 'Driver shift deleted successfully' };
  }
}
