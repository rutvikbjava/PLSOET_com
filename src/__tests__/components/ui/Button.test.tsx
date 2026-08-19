import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByText('Click me');
    expect(button).toBeTruthy();
    expect(button.tagName).toBe('BUTTON');
  });

  it('should apply primary variant by default', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByText('Click me');
    expect(button.className).toContain('bg-blue-600');
  });

  it('should apply secondary variant when specified', () => {
    render(<Button variant="secondary">Click me</Button>);
    const button = screen.getByText('Click me');
    expect(button.className).toContain('bg-gray-200');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    const button = screen.getByText('Click me') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should show loading state', () => {
    render(<Button isLoading>Click me</Button>);
    const button = screen.getByText('Click me') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.querySelector('svg')).toBeTruthy();
  });

  it('should apply size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByText('Small');
    expect(button.className).toContain('px-3');
    expect(button.className).toContain('py-1.5');

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByText('Large');
    expect(button.className).toContain('px-6');
    expect(button.className).toContain('py-3');
  });
});
