import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from './Landing.js';

beforeEach(() => {
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
});

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  console.warn.mockRestore();
});

test('Renders h1 in center box', () => {
  const heading = screen.getByText(/Welcome to ChetChat!/i);
  expect(heading).toBeInTheDocument();
  expect(heading.tagName).toBe('H1');
});

test('Register button goes to /register AND displays correct text', () => {
  // Check if button text is good
  const button = screen.getByRole('button', {name: /Get Started!/i});
  expect(button).toBeInTheDocument();
  // Check if parent link is correct
  const registerLink = button.closest('a');
  expect(registerLink).toHaveAttribute('href', '/register');
});