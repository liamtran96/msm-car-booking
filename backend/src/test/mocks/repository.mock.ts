import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';

/**
 * Creates a mock TypeORM repository with common methods
 */
export function createMockRepository<T extends ObjectLiteral>(): jest.Mocked<
  Repository<T>
> {
  const mockQueryBuilder = createMockQueryBuilder<T>();

  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(<E>(entity: E): E => entity),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    merge: jest.fn(
      <E extends object>(entity: E, ...updates: Partial<E>[]): E =>
        Object.assign(entity, ...updates) as E,
    ),
    preload: jest.fn(),
    insert: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    exist: jest.fn(),
    exists: jest.fn(),
    findBy: jest.fn(),
    findAndCount: jest.fn(),
    findAndCountBy: jest.fn(),
    findOneOrFail: jest.fn(),
    findOneByOrFail: jest.fn(),
    query: jest.fn(),
    clear: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    // Add other methods as needed
  } as unknown as jest.Mocked<Repository<T>>;
}

/**
 * Creates a mock query builder with chainable methods
 */
export function createMockQueryBuilder<T extends ObjectLiteral>(): jest.Mocked<
  SelectQueryBuilder<T>
> {
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    distinctOn: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getCount: jest.fn().mockResolvedValue(0),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getRawOne: jest.fn().mockResolvedValue(null),
    getRawMany: jest.fn().mockResolvedValue([]),
    execute: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<SelectQueryBuilder<T>>;

  return mockQueryBuilder;
}

/**
 * Sets up the mock query builder to return specific results
 */
export function setupQueryBuilderResult<T extends ObjectLiteral>(
  mockRepo: jest.Mocked<Repository<T>>,
  results: T[],
  count?: number,
): void {
  const qb = mockRepo.createQueryBuilder() as jest.Mocked<
    SelectQueryBuilder<T>
  >;
  qb.getMany.mockResolvedValue(results);
  qb.getCount.mockResolvedValue(count ?? results.length);
  qb.getManyAndCount.mockResolvedValue([results, count ?? results.length]);
  if (results.length > 0) {
    qb.getOne.mockResolvedValue(results[0]);
  }
}
