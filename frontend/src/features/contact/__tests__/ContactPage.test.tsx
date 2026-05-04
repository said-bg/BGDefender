import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { sendContactRequest } from '@/services/contact';
import ContactPage from '../ContactPage';

jest.mock('@/services/contact', () => ({
  sendContactRequest: jest.fn(),
}));

const translations: Record<string, string> = {
  'hero.eyebrow': 'Contact BG Defender',
  'hero.title': 'Contact us',
  'hero.description':
    'Reach out for support, access requests, creator onboarding, or premium questions. We will help you get to the right place quickly.',
  'types.general.title': 'General information',
  'types.general.description': 'Questions about the platform, courses, or availability.',
  'types.support.title': 'Technical support',
  'types.support.description': 'Something is not working as expected? We can help.',
  'types.creator.title': 'Creator access',
  'types.creator.description': 'Request access to create and manage learning content.',
  'types.premium.title': 'Premium access',
  'types.premium.description': 'Ask about premium access, tailored plans, or upgrades.',
  'fields.requestType': 'Request type',
  'fields.name': 'Full name',
  'fields.namePlaceholder': 'Your name',
  'fields.email': 'Email address',
  'fields.emailPlaceholder': 'you@example.com',
  'fields.message': 'Message',
  'fields.messagePlaceholder': 'Share the details you want our team to review and respond to.',
  'form.primaryAction': 'Send message',
  'form.secondaryAction': 'Email support directly',
  'form.sending': 'Sending...',
  'form.note': 'Your message will be sent directly to the BG Defender team.',
  'form.failed': 'We could not send your message right now. Please try again.',
  'validation.nameRequired': 'Name is required',
  'validation.emailRequired': 'Email is required',
  'validation.emailInvalid': 'Invalid email format',
  'validation.messageRequired': 'Message is required',
};

const mockT = (key: string, options?: Record<string, string>) => {
  const template = translations[key] ?? key;

  return Object.entries(options ?? {}).reduce(
    (value, [token, replacement]) => value.replace(`{{${token}}}`, replacement),
    template,
  );
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

describe('ContactPage', () => {
  it('submits the contact request and shows the success message', async () => {
    const mockedSendContactRequest = jest.mocked(sendContactRequest);
    mockedSendContactRequest.mockResolvedValue({
      message: 'Your message has been sent. We will get back to you by email.',
    });

    render(<ContactPage />);

    expect(
      screen.getByRole('heading', {
        name: 'Contact us',
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

    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => {
      expect(mockedSendContactRequest).toHaveBeenCalledWith({
        requestType: 'creator',
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Please help me set up creator access.',
      });
    });

    expect(
      screen.getByText('Your message has been sent. We will get back to you by email.'),
    ).toBeInTheDocument();
  });
});
