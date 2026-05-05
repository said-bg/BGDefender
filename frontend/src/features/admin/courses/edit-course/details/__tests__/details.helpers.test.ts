import type { Course } from '@/services/course';
import type { EditCourseFormState } from '../lib/details.types';
import {
  buildUpdateCoursePayload,
  getLocalizedCourseTitle,
  mapCourseToForm,
  validateCourseDetailsForm,
} from '../lib/details.helpers';

const adminTranslations: Record<string, string> = {
  'create.titleRequired': 'Both English and Finnish titles are required.',
  'create.descriptionRequired': 'Both English and Finnish descriptions are required.',
  'create.durationInvalid': 'Estimated duration must be greater than zero.',
};

const t = (key: string, options?: Record<string, unknown>) =>
  String(options?.defaultValue ?? adminTranslations[key] ?? key);

const createCourse = (overrides: Partial<Course> = {}): Course => ({
  id: 'course-1',
  titleEn: 'English title',
  titleFi: 'Finnish title',
  descriptionEn: 'English description',
  descriptionFi: 'Finnish description',
  level: 'premium',
  status: 'published',
  estimatedDuration: 90,
  coverImage: '/cover.jpg',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  authors: [
    {
      id: 'author-1',
      name: 'Alex Morgan',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  chapters: [],
  ...overrides,
});

const createForm = (
  overrides: Partial<EditCourseFormState> = {},
): EditCourseFormState => ({
  titleEn: ' English title ',
  titleFi: ' Finnish title ',
  descriptionEn: ' English description ',
  descriptionFi: ' Finnish description ',
  level: 'free',
  status: 'draft',
  estimatedDuration: ' 120 ',
  coverImage: ' /cover.jpg ',
  authorIds: ['author-1'],
  ...overrides,
});

describe('details.helpers', () => {
  // Verifies that the edit form starts from a stable shape derived from the API course.
  it('maps a course to the editable form state', () => {
    expect(mapCourseToForm(createCourse())).toEqual({
      titleEn: 'English title',
      titleFi: 'Finnish title',
      descriptionEn: 'English description',
      descriptionFi: 'Finnish description',
      level: 'premium',
      status: 'published',
      estimatedDuration: '90',
      coverImage: '/cover.jpg',
      authorIds: ['author-1'],
    });
  });

  it('maps archived courses back to draft in the form', () => {
    expect(mapCourseToForm(createCourse({ status: 'archived' }))).toMatchObject({
      status: 'draft',
    });
  });

  // Keeps page headings bilingual and safe before the course has loaded.
  it('returns the localized course title with empty fallback', () => {
    expect(getLocalizedCourseTitle(createCourse(), 'fi')).toBe('Finnish title');
    expect(getLocalizedCourseTitle(createCourse(), 'en')).toBe('English title');
    expect(getLocalizedCourseTitle(null, 'en')).toBe('');
  });

  // Protects the backend from incomplete translated course details.
  it('validates required titles and descriptions', () => {
    expect(validateCourseDetailsForm(createForm({ titleFi: '   ' }), t)).toBe(
      'Both English and Finnish titles are required.',
    );

    expect(
      validateCourseDetailsForm(createForm({ descriptionEn: '   ' }), t),
    ).toBe('Both English and Finnish descriptions are required.');
  });

  // Prevents invalid duration values while allowing an empty optional duration.
  it('validates estimated duration only when it is provided', () => {
    expect(
      validateCourseDetailsForm(createForm({ estimatedDuration: '0' }), t),
    ).toBe('Estimated duration must be greater than zero.');

    expect(
      validateCourseDetailsForm(createForm({ estimatedDuration: '' }), t),
    ).toBeNull();
  });

  // Ensures the update payload is trimmed and converts form strings into API values.
  it('builds a trimmed update payload', () => {
    expect(buildUpdateCoursePayload(createForm())).toEqual({
      titleEn: 'English title',
      titleFi: 'Finnish title',
      descriptionEn: 'English description',
      descriptionFi: 'Finnish description',
      level: 'free',
      status: 'draft',
      estimatedDuration: 120,
      coverImage: '/cover.jpg',
      authorIds: ['author-1'],
    });
  });

  // Keeps the optional duration omitted instead of sending a fake zero.
  it('omits estimated duration when the field is blank', () => {
    expect(
      buildUpdateCoursePayload(createForm({ estimatedDuration: '   ' })),
    ).toMatchObject({
      estimatedDuration: undefined,
    });
  });
});

