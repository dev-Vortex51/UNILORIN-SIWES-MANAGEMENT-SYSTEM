const modelMethods = () => ({
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  groupBy: jest.fn(),
  aggregate: jest.fn(),
  upsert: jest.fn(),
  deleteMany: jest.fn(),
  updateMany: jest.fn(),
  createMany: jest.fn(),
});

const createPrismaMock = () => ({
  $on: jest.fn(),
  $use: jest.fn(),
  $transaction: jest.fn((cb) => cb(createPrismaMock())),
  $queryRaw: jest.fn(),
  $executeRawUnsafe: jest.fn(),

  user: modelMethods(),
  student: modelMethods(),
  placement: modelMethods(),
  logbook: modelMethods(),
  logbookReview: modelMethods(),
  assessment: modelMethods(),
  attendance: modelMethods(),
  supervisor: modelMethods(),
  faculty: modelMethods(),
  department: modelMethods(),
  industryPartner: modelMethods(),
  notification: modelMethods(),
  invitation: modelMethods(),
  visit: modelMethods(),
  auditLog: modelMethods(),
  systemSettings: modelMethods(),
  supervisorAssignment: modelMethods(),
  coordinatorDepartment: modelMethods(),
});

const mockReset = (mockObj) => {
  Object.values(mockObj).forEach((model) => {
    if (typeof model === "object" && model !== null) {
      Object.values(model).forEach((fn) => {
        if (jest.isMockFunction(fn)) fn.mockReset();
      });
    }
  });
};

module.exports = { createPrismaMock, mockReset };
