import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RegisterUser from './Register.js';

// Mock useAuth
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  useAuth.mockReturnValue({ isLoggedIn: false });
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

test('Renders register form correctly', () => {
  render(<MemoryRouter><RegisterUser /></MemoryRouter>);

  expect(screen.getByRole('heading', { name: /Register/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  expect(screen.getByLabelText('Password')).toBeInTheDocument(); // matches id="passWord"
  expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Login here/i })).toHaveAttribute('href', '/login');
});

test('Register form inputs update on change', () => {
  render(<MemoryRouter><RegisterUser /></MemoryRouter>);

  const fields = [
    { label: 'First Name', value: 'John' },
    { label: 'Last Name', value: 'Doe' },
    { label: 'Username', value: 'johndoe' },
    { label: 'Email', value: 'john@example.com' },
    { label: 'Password', value: 'password' },
    { label: 'Confirm Password', value: 'password' },
  ];

  fields.forEach(({ label, value }) => {
    const input = screen.getByLabelText(label);
    fireEvent.change(input, { target: { value } });
    expect(input.value).toBe(value);
  });
});


test('Shows error when passwords do not match', () => {
  render(
    <MemoryRouter>
      <RegisterUser />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'drowssap' } });

  fireEvent.click(screen.getByRole('button', { name: /Register/i }));
  expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
});

test('Successful registration triggers redirect', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ message: 'Registered' }),
  });

  render(
    <MemoryRouter>
      <RegisterUser />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
  fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
  fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'johndoe' } });
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: '12345' } });
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: '12345' } });

  // Simulate a request to the backend with success
  jest.useFakeTimers();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));
  });
  act(() => {
    jest.advanceTimersByTime(2000);
  });
  expect(mockNavigate).toHaveBeenCalledWith('/login');
  jest.useRealTimers();
});

test('Redirects if user is already logged in', () => {
  useAuth.mockReturnValue({ isLoggedIn: true });

  render(
    <MemoryRouter>
      <RegisterUser />
    </MemoryRouter>
  );

  // Should redirect immediately, so form is not present
  expect(screen.queryByRole('heading', { name: /Register/i })).not.toBeInTheDocument();
});