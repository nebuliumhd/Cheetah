import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../src/Components/LandingNav.js';

beforeEach(() => {
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
});

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  console.warn.mockRestore();
});

// describe('Navbar tests', () => {

// });

test('Navbar renders site title', () => {
  expect(screen.getByText(/ChetChat/i)).toBeInTheDocument();
});

test('Navbar renders register link', () => {
  const registerLink = screen.getByText(/Register/i);
  expect(registerLink).toBeInTheDocument();
  expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
});

test('Navbar renders login button', () => {
  const loginButton = screen.getByRole('button', { name: /Login/i });
  expect(loginButton).toBeInTheDocument();
  expect(loginButton.closest('a')).toHaveAttribute('href', '/login');
});
