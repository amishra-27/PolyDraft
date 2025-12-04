// Test script to verify the PickConfirmationModal component
import { render, screen, fireEvent } from '@testing-library/react';
import { PickConfirmationModal } from '../components/PickConfirmationModal';
import { PolymarketMarket } from '../lib/api/types';

// Mock market data
const mockMarket: PolymarketMarket = {
  id: 'test-market-1',
  question: 'Will Bitcoin reach $100k by end of 2024?',
  description: 'Test market description',
  endTime: '2024-12-31T23:59:59Z',
  startTime: '2024-01-01T00:00:00Z',
  image: '',
  slug: 'test-market',
  active: true,
  closed: false,
  resolved: false,
  volume: '1000000',
  liquidity: '50000',
  tokenPrice: '0.5',
  outcomePrices: '0.6,0.4',
  outcomes: ['YES', 'NO'],
  tags: ['crypto'],
  category: 'crypto',
  clobTokenIds: 'token1,token2',
  events: [],
  negRisk: false,
};

describe('PickConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    market: mockMarket,
    selectedOutcome: null,
    onSelectOutcome: jest.fn(),
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    isLoading: false,
    error: null,
  };

  it('renders market details correctly', () => {
    render(<PickConfirmationModal {...defaultProps} />);
    
    expect(screen.getByText('Confirm Your Pick')).toBeInTheDocument();
    expect(screen.getByText(mockMarket.question)).toBeInTheDocument();
    expect(screen.getByText(mockMarket.description)).toBeInTheDocument();
    expect(screen.getByText('crypto')).toBeInTheDocument();
  });

  it('shows YES and NO buttons with correct probabilities', () => {
    render(<PickConfirmationModal {...defaultProps} />);
    
    const yesButton = screen.getByText('YES');
    const noButton = screen.getByText('NO');
    
    expect(yesButton).toBeInTheDocument();
    expect(noButton).toBeInTheDocument();
    expect(screen.getByText('60% chance')).toBeInTheDocument(); // YES probability
    expect(screen.getByText('40% chance')).toBeInTheDocument(); // NO probability
  });

  it('calls onSelectOutcome when YES is clicked', () => {
    const onSelectOutcome = jest.fn();
    render(<PickConfirmationModal {...defaultProps} onSelectOutcome={onSelectOutcome} />);
    
    const yesButton = screen.getByText('YES');
    fireEvent.click(yesButton);
    
    expect(onSelectOutcome).toHaveBeenCalledWith('YES');
  });

  it('calls onSelectOutcome when NO is clicked', () => {
    const onSelectOutcome = jest.fn();
    render(<PickConfirmationModal {...defaultProps} onSelectOutcome={onSelectOutcome} />);
    
    const noButton = screen.getByText('NO');
    fireEvent.click(noButton);
    
    expect(onSelectOutcome).toHaveBeenCalledWith('NO');
  });

  it('shows selected outcome summary', () => {
    render(<PickConfirmationModal {...defaultProps} selectedOutcome="YES"} />);
    
    expect(screen.getByText('You picked YES')).toBeInTheDocument();
    expect(screen.getByText('60% implied probability')).toBeInTheDocument();
  });

  it('disables confirm button when no outcome is selected', () => {
    render(<PickConfirmationModal {...defaultProps} />);
    
    const confirmButton = screen.getByText('Confirm Pick');
    expect(confirmButton).toBeDisabled();
  });

  it('enables confirm button when outcome is selected', () => {
    render(<PickConfirmationModal {...defaultProps} selectedOutcome="YES"} />);
    
    const confirmButton = screen.getByText('Confirm YES');
    expect(confirmButton).not.toBeDisabled();
  });

  it('shows loading state', () => {
    render(<PickConfirmationModal {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<PickConfirmationModal {...defaultProps} error="Test error" />);
    
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<PickConfirmationModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Confirm Your Pick')).not.toBeInTheDocument();
  });
});

console.log('PickConfirmationModal test cases created successfully!');