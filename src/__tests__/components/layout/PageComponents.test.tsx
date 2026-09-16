/**
 * Layout Components Tests
 * 
 * Tests for reusable page layout components.
 * These tests verify component structure and exported API.
 */

import { render, screen } from '@testing-library/react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { LoadingState } from '@/components/layout/LoadingState';
import { ErrorState } from '@/components/layout/ErrorState';

describe('PageContainer', () => {
  it('should render children', () => {
    render(
      <PageContainer>
        <div>Test content</div>
      </PageContainer>
    );
    expect(screen.getByText('Test content')).toBeTruthy();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <PageContainer className="custom-class">
        <div>Test</div>
      </PageContainer>
    );
    expect(container.firstChild?.nodeType).toBe(Node.ELEMENT_NODE);
  });
});

describe('PageHeader', () => {
  it('should render title', () => {
    render(<PageHeader title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeTruthy();
  });

  it('should render description when provided', () => {
    render(<PageHeader title="Title" description="Test description" />);
    expect(screen.getByText('Test description')).toBeTruthy();
  });

  it('should render actions when provided', () => {
    render(
      <PageHeader
        title="Title"
        actions={<button>Action Button</button>}
      />
    );
    expect(screen.getByText('Action Button')).toBeTruthy();
  });

  it('should not render description when not provided', () => {
    render(<PageHeader title="Title" />);
    expect(screen.queryByText('Test description')).toBeNull();
  });
});

describe('EmptyState', () => {
  it('should render title and description', () => {
    render(<EmptyState title="No Data" description="Nothing to show" />);
    expect(screen.getByText('No Data')).toBeTruthy();
    expect(screen.getByText('Nothing to show')).toBeTruthy();
  });

  it('should render action button when provided', () => {
    const mockAction = jest.fn();
    render(
      <EmptyState
        title="No Data"
        description="Nothing to show"
        action={{ label: 'Create New', onClick: mockAction }}
      />
    );
    expect(screen.getByText('Create New')).toBeTruthy();
  });

  it('should not render action button when not provided', () => {
    render(<EmptyState title="No Data" description="Nothing to show" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('should render icon when provided', () => {
    render(
      <EmptyState
        title="No Data"
        description="Nothing to show"
        icon={<div data-testid="custom-icon">Icon</div>}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeTruthy();
  });
});

describe('LoadingState', () => {
  it('should render with default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('should render with custom message', () => {
    render(<LoadingState message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeTruthy();
  });

  it('should have loading status role', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('should render different sizes', () => {
    const { rerender } = render(<LoadingState size="sm" />);
    expect(screen.getByRole('status')).toBeTruthy();

    rerender(<LoadingState size="md" />);
    expect(screen.getByRole('status')).toBeTruthy();

    rerender(<LoadingState size="lg" />);
    expect(screen.getByRole('status')).toBeTruthy();
  });
});

describe('ErrorState', () => {
  it('should render default title and message', () => {
    render(<ErrorState message="An error occurred" />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('An error occurred')).toBeTruthy();
  });

  it('should render custom title', () => {
    render(<ErrorState title="Custom Error" message="Error details" />);
    expect(screen.getByText('Custom Error')).toBeTruthy();
    expect(screen.getByText('Error details')).toBeTruthy();
  });

  it('should render action button when provided', () => {
    const mockAction = jest.fn();
    render(
      <ErrorState
        message="An error occurred"
        action={{ label: 'Try Again', onClick: mockAction }}
      />
    );
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('should not render action button when not provided', () => {
    render(<ErrorState message="An error occurred" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
