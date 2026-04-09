import authorService from '@/services/authorService';
import courseService from '@/services/courseService';

export const loadCourseDetailsPageData = async (courseId: string) => {
  const [courseResponse, authorsResponse] = await Promise.all([
    courseService.getCourseById(courseId),
    authorService.getAuthors(100, 0),
  ]);

  return {
    authors: authorsResponse.data,
    course: courseResponse,
  };
};
