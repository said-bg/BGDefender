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
  'form.title': 'Send us a message',
  'form.description': 'Fill out the form below and we will get back to you as soon as possible.',
  'fields.name': 'Full name',
  'fields.namePlaceholder': 'Your name',
  'fields.email': 'Email address',
  'fields.emailPlaceholder': 'you@example.com',
  'fields.subject': 'Subject',
  'fields.message': 'Message',
  'fields.messagePlaceholder': 'Share the details you want our team to review and respond to.',
  'types.general.title': 'General information',
  'types.support.title': 'Technical support',
  'types.creator.title': 'Creator access',
  'types.premium.title': 'Premium access',
  'form.primaryAction': 'Send message',
  'form.secondaryAction': 'Email support directly',
  'form.sending': 'Sending...',
  'form.note': 'Your message will be sent directly to the BG Defender team.',
  'form.privacyNote': 'Your information is safe with us. We will never share your data.',
  'form.failed': 'We could not send your message right now. Please try again.',
  'details.emailTitle': 'Email us',
  'details.responseTitle': 'Average response time',
  'details.responseDescription': 'We reply within 24 hours on business days.',
  'details.supportTitle': 'Expert support',
  'details.supportDescription': 'Get help from our cybersecurity and training specialists.',
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
        requestType: 'general',
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
