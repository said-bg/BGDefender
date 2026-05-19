import authorService from '@/services/authors';
import courseService from '@/services/course';

export const loadCourseDetailsPageData = async (courseId: string) => {
  const [courseResponse, authorsResponse] = await Promise.all([
    courseService.getAdminCourseById(courseId),
    authorService.getAuthorsForCourse(courseId, 100, 0),
  ]);

  return {
    authors: authorsResponse.data,
    course: courseResponse,
  };
};

