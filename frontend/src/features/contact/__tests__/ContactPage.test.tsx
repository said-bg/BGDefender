import { fireEvent, render, screen } from '@testing-library/react';
import ContactPage from '../ContactPage';

const mockT = (key: string, options?: Record<string, string>) => {
  if (!options?.defaultValue) {
    return key;
  }

  return Object.entries(options).reduce((value, [token, replacement]) => {
    if (token === 'defaultValue') {
      return value;
    }

    return value.replace(`{{${token}}}`, replacement);
  }, options.defaultValue);
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

describe('ContactPage', () => {
  it('prefills the request email link from the selected request type and form content', () => {
    render(<ContactPage />);

    expect(
      screen.getByRole('heading', {
        name: 'Contact the team',
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Creator access/ }));
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Please help me set up creator access.' },
    });

    const action = screen.getByRole('link', { name: 'Prepare email' });

    expect(action).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:support@bgdefender.com?subject=Creator%20access%20request'),
    );
    expect(action).toHaveAttribute('href', expect.stringContaining('Jane%20Doe'));
    expect(action).toHaveAttribute('href', expect.stringContaining('creator%20access'));
    expect(action).not.toHaveAttribute('aria-disabled', 'true');
  });
});
