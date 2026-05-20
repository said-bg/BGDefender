import { buildCourseMetadata, buildPublicCourseSeoPath } from '../courseSeo';

const createCourse = () => ({
  id: 'course-1',
  slugEn: 'incident-response-forensics',
  slugFi: 'poikkeamiin-vastaaminen-ja-digitaalinen-forensiikka',
  titleEn: 'Incident Response & Forensics',
  titleFi: 'Incident Response ja forensiikka',
  descriptionEn:
    'Learn how to respond to incidents, preserve evidence, and investigate attacks with a practical cybersecurity learning path.',
  descriptionFi:
    'Opi reagoimaan poikkeamiin, sailyttamaan todistusaineistoa ja tutkimaan hyokkayksia kaytannollisella kyberturvallisuuskurssilla.',
  coverImage: '/assets/images/bgdefender.jpeg',
});

describe('courseSeo', () => {
  it('builds a slug-based public course path', () => {
    expect(buildPublicCourseSeoPath(createCourse(), 'en')).toBe(
      '/courses/incident-response-forensics',
    );

    expect(buildPublicCourseSeoPath(createCourse(), 'fi')).toBe(
      '/courses/poikkeamiin-vastaaminen-ja-digitaalinen-forensiikka',
    );
  });

  it('builds localized metadata with canonical slug URLs', () => {
    const metadata = buildCourseMetadata('en', createCourse());

    expect(metadata.title).toBe('Incident Response & Forensics | Defender Academy');
    expect(metadata.alternates).toEqual({
      canonical: '/en/courses/incident-response-forensics',
      languages: {
        fi: '/fi/kurssit/poikkeamiin-vastaaminen-ja-digitaalinen-forensiikka',
        en: '/en/courses/incident-response-forensics',
      },
    });
  });
});
