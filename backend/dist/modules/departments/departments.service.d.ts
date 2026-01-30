import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
export declare class DepartmentsService {
    private readonly departmentRepository;
    constructor(departmentRepository: Repository<Department>);
    findAll(): Promise<Department[]>;
    findById(id: string): Promise<Department>;
}
