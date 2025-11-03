import { createUser, findUserByUsername, findUserByEmail } from "../../models/userModels.js"
import { db } from "../db.js"

jest.mock('../db.js', () => ({
    db: {query: jest.fn()},
}));

beforeEach(() => {
    jest.clearAllMocks();
});

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  console.warn.mockRestore();
  jest.useRealTimers();
});

test('Able to create new users', () => {
    const mockUser = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      userName: "johndoe",
      passWord: "password123",
    };

    const mockCallback = jest.fn();
    db.query.mockImplementation((query, values, cb) => cb(null, { insertId: 1}));

    createUser(mockUser)
});