import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileForm from '@/components/ProfileForm';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the API
jest.mock('@/lib/api', () => ({
  user: {
    updateProfile: jest.fn(),
  },
}));

const mockUpdateProfile = require('@/lib/api').user.updateProfile;

const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phoneNumber: '+1234567890',
  dateOfBirth: '1990-01-15T00:00:00Z',
  address: '123 Main St',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  country: 'United States',
  isEmailVerified: true,
  createdAt: '2025-10-22T00:00:00Z',
  updatedAt: '2025-10-22T00:00:00Z',
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('ProfileForm', () => {
  const defaultProps = {
    user: mockUser,
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile form correctly', () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('populates form with user data', () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
    expect(screen.getByDisplayValue('New York')).toBeInTheDocument();
    expect(screen.getByDisplayValue('NY')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10001')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    // Clear required fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: '' } });
    
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const phoneInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneInput, { target: { value: '123' } });
    
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid phone number format/i)).toBeInTheDocument();
    });
  });

  it('validates date of birth', async () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const dobInput = screen.getByLabelText(/date of birth/i);
    fireEvent.change(dobInput, { target: { value: '2030-01-01' } });
    
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/date of birth cannot be in the future/i)).toBeInTheDocument();
    });
  });

  it('validates zip code format', async () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const zipInput = screen.getByLabelText(/zip code/i);
    fireEvent.change(zipInput, { target: { value: '123' } });
    
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid zip code format/i)).toBeInTheDocument();
    });
  });

  it('updates profile successfully', async () => {
    mockUpdateProfile.mockResolvedValueOnce({
      data: {
        user: {
          ...mockUser,
          firstName: 'Jane',
          lastName: 'Smith',
        },
      },
    });

    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    // Update the name
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Smith' } });
    
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-15T00:00:00Z',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('handles update error', async () => {
    mockUpdateProfile.mockRejectedValueOnce(new Error('Update failed'));

    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/update failed/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockUpdateProfile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/saving changes/i)).toBeInTheDocument();
  });

  it('closes modal when cancel button is clicked', () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes modal when X button is clicked', () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    const closedProps = {
      ...defaultProps,
      isOpen: false,
    };
    
    renderWithProviders(<ProfileForm {...closedProps} />);
    
    expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
  });

  it('shows country options', () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const countrySelect = screen.getByLabelText(/country/i);
    fireEvent.click(countrySelect);
    
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('Canada')).toBeInTheDocument();
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
  });

  it('handles empty optional fields', async () => {
    const userWithEmptyFields = {
      ...mockUser,
      phoneNumber: null,
      dateOfBirth: null,
      address: null,
      city: null,
      state: null,
      zipCode: null,
      country: null,
    };

    const propsWithEmptyFields = {
      ...defaultProps,
      user: userWithEmptyFields,
    };

    mockUpdateProfile.mockResolvedValueOnce({
      data: {
        user: userWithEmptyFields,
      },
    });

    renderWithProviders(<ProfileForm {...propsWithEmptyFields} />);
    
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: null,
        dateOfBirth: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
      });
    });
  });

  it('shows email verification status', () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    if (mockUser.isEmailVerified) {
      expect(screen.getByText(/verified/i)).toBeInTheDocument();
    }
  });

  it('disables email field', () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toBeDisabled();
  });

  it('validates name length', async () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'A' } });
    
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/first name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('validates state format', async () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const stateInput = screen.getByLabelText(/state/i);
    fireEvent.change(stateInput, { target: { value: '123' } });
    
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/state must be 2 characters/i)).toBeInTheDocument();
    });
  });

  it('shows account creation date', () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    expect(screen.getByText(/account created/i)).toBeInTheDocument();
    expect(screen.getByText(/last updated/i)).toBeInTheDocument();
  });

  it('handles network errors gracefully', async () => {
    mockUpdateProfile.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
