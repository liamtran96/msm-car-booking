import { UserRole, UserSegment } from '../../../common/enums';
export declare class CreateUserDto {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: UserRole;
    userSegment?: UserSegment;
    departmentId?: string;
}
