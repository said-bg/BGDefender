import { buildPublicCoursePath, getPublicCourseIdentifier } from '../coursePublicPath';

describe('coursePublicPath', () => {
  it('prefers the persisted slug when available', () => {
    expect(
      getPublicCourseIdentifier({
        id: 'course-1',
        slugEn: 'incident-response-forensics',
        slugFi: 'poikkeamiin-vastaaminen-ja-digitaalinen-forensiikka',
      }),
    ).toBe('incident-response-forensics');

    expect(
      getPublicCourseIdentifier(
        {
          id: 'course-1',
          slugEn: 'incident-response-forensics',
          slugFi: 'poikkeamiin-vastaaminen-ja-digitaalinen-forensiikka',
        },
        'fi',
      ),
    ).toBe('poikkeamiin-vastaaminen-ja-digitaalinen-forensiikka');
  });

  it('falls back to the course id when slug is missing', () => {
    expect(
      getPublicCourseIdentifier({
        id: 'course-1',
        slugEn: null,
        slugFi: null,
      }),
    ).toBe('course-1');
  });

  it('builds locale-aware public paths', () => {
    expect(
      buildPublicCoursePath(
        {
          id: 'course-1',
          slugEn: 'incident-response-forensics',
          slugFi: 'poikkeamiin-vastaaminen-ja-digitaalinen-forensiikka',
        },
        'en',
      ),
    ).toBe('/en/courses/incident-response-forensics');

    expect(
      buildPublicCoursePath(
        {
          id: 'course-1',
          slugEn: 'incident-response-forensics',
          slugFi: 'poikkeamiin-vastaaminen-ja-digitaalinen-forensiikka',
        },
        'fi',
      ),
    ).toBe('/fi/kurssit/poikkeamiin-vastaaminen-ja-digitaalinen-forensiikka');
  });
});
