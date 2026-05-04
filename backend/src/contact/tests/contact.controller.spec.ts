import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../../email/email.service';
import { ContactController } from '../controllers/contact.controller';
import { ContactRequestType } from '../dto/contact-request.dto';

describe('ContactController', () => {
  let controller: ContactController;

  const mockEmailService = {
    sendContactEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    controller = module.get<ContactController>(ContactController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends the contact request email and returns the english success message', async () => {
    const dto = {
      requestType: ContactRequestType.SUPPORT,
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'The lesson page does not load for me.',
    };

    mockEmailService.sendContactEmail.mockResolvedValue(undefined);

    const result = await controller.submitContactRequest(dto);

    expect(mockEmailService.sendContactEmail).toHaveBeenCalledWith({
      ...dto,
      language: 'en',
    });
    expect(result).toEqual({
      message: 'Your message has been sent. We will get back to you by email.',
    });
  });

  it('returns the finnish success message when requested', async () => {
    const dto = {
      requestType: ContactRequestType.CREATOR,
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Haluan pyytää sisällöntuottajan käyttöoikeutta.',
    };

    mockEmailService.sendContactEmail.mockResolvedValue(undefined);

    const result = await controller.submitContactRequest(
      dto,
      'fi-FI,fi;q=0.9',
    );

    expect(mockEmailService.sendContactEmail).toHaveBeenCalledWith({
      ...dto,
      language: 'fi',
    });
    expect(result).toEqual({
      message: 'Viestisi on lähetetty. Otamme sinuun yhteyttä sähköpostitse.',
    });
  });
});
