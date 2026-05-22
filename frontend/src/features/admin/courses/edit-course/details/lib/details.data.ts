import authorService from '@/services/authors';
import certificateSignerService from '@/services/certificate-signers';
import courseService from '@/services/course';

export const loadCourseDetailsPageData = async (courseId: string) => {
  const [courseResponse, authorsResponse, signerOptions] = await Promise.all([
    courseService.getAdminCourseById(courseId),
    authorService.getAuthorsForCourse(courseId, 100, 0),
    certificateSignerService.getOptions(),
  ]);

  return {
    authors: authorsResponse.data,
    course: courseResponse,
    programDirectors: signerOptions.programDirectors,
  };
};

