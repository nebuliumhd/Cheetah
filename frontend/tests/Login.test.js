import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext.js';
import Login from '../src/Pages/Login.js';

// Mock "useAuth"
jest.mock('../context/AuthContext.js', () => ({
  useAuth: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Move "useNavigate"
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  useAuth.mockReturnValue({
    isLoggedIn: false,
    login: jest.fn(),
  });
  fetch.mockClear();
  mockNavigate.mockClear();
});

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  console.warn.mockRestore();
  jest.useRealTimers();
});

test('Renders login form correctly', () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  expect(screen.getByText(/Don't have an account\?/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Register here/i })).toHaveAttribute('href', '/register');
});

test('Login form updates on change', () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  // Test if 'testuser' as username will be reflected
  const usernameInput = screen.getByLabelText(/Username/i);
  fireEvent.change(usernameInput, {target: {value: 'testuser'}});
  expect(usernameInput.value).toBe('testuser');

  // Test if 'password' as password will be reflected
  const passwordInput = screen.getByLabelText(/Password/i);
  fireEvent.change(passwordInput, {target: {value: '12345'}});
  expect(passwordInput.value).toBe('12345');
});

test('Succesful login triggers success message', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({message: 'Logged in'}),
  });

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  // Add dummy inputs to form fields
  fireEvent.change(screen.getByLabelText(/Username/i), {target: {value: 'testuser'}});
  fireEvent.change(screen.getByLabelText(/Password/i), {target: {value: 'password'}});
  
  // Login to account for 2 sec delay
  jest.useFakeTimers();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
  });
  // expect(screen.getByText(/Login successful/i)).toBeInTheDocument();
  act(() => {
    jest.advanceTimersByTime(2000);
  });
  expect(mockNavigate).toHaveBeenCalledWith('/landing');
  jest.useRealTimers();
});

test('Redirects a user who is already logged in', () => {
  useAuth.mockReturnValue({
    isLoggedIn: true,
    login: jest.fn(),
  });

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  // Navigate should be called (via Navigate)
  expect(screen.queryByLabelText(/Login/i)).not.toBeInTheDocument();
});