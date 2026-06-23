const { mockDeep, mockReset } = require("jest-mock-extended");

const prisma = mockDeep();

const PrismaClient = jest.fn(() => prisma);

module.exports = { PrismaClient, prisma };
