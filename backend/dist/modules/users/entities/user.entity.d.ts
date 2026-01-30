import { UserRole, UserSegment } from '../../../common/enums';
import { Department } from '../../departments/entities/department.entity';
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    phone: string;
    role: UserRole;
    userSegment: UserSegment;
    departmentId: string;
    department: Department;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
