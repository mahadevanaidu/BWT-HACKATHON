import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { FileText } from 'lucide-react';

describe('StatusBadge', () => {
  it('renders valid status', () => {
    render(<StatusBadge status="valid" />);
    expect(screen.getByText('Valid')).toBeTruthy();
  });
  it('renders revoked status', () => {
    render(<StatusBadge status="revoked" />);
    expect(screen.getByText('Revoked')).toBeTruthy();
  });
  it('renders expired status', () => {
    render(<StatusBadge status="expired" />);
    expect(screen.getByText('Expired')).toBeTruthy();
  });
  it('renders not_found status', () => {
    render(<StatusBadge status="not_found" />);
    expect(screen.getByText('Not Found')).toBeTruthy();
  });
});

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeTruthy();
  });
  it('calls onClick', () => {
    const fn = vi.fn();
    render(<Button onClick={fn}>Press</Button>);
    fireEvent.click(screen.getByText('Press'));
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });
  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('Input', () => {
  it('renders label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeTruthy();
  });
  it('shows error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeTruthy();
  });
  it('shows hint when no error', () => {
    render(<Input label="Email" hint="Enter your email" />);
    expect(screen.getByText('Enter your email')).toBeTruthy();
  });
});

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState icon={FileText} title="Nothing here" description="Add something" />);
    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.getByText('Add something')).toBeTruthy();
  });
  it('renders action', () => {
    render(<EmptyState title="Empty" action={<button>Add</button>} />);
    expect(screen.getByText('Add')).toBeTruthy();
  });
});

describe('Modal', () => {
  it('renders when open', () => {
    render(
      <MemoryRouter>
        <Modal isOpen title="Test Modal" onClose={vi.fn()}>
          <p>Modal content</p>
        </Modal>
      </MemoryRouter>
    );
    expect(screen.getByText('Test Modal')).toBeTruthy();
    expect(screen.getByText('Modal content')).toBeTruthy();
  });
  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} title="Hidden" onClose={vi.fn()}>
        <p>Hidden content</p>
      </Modal>
    );
    expect(screen.queryByText('Hidden')).toBeNull();
  });
  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen title="Closable" onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalled();
  });
});
