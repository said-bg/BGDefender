import { apiClient } from '../api';
import type {
  AdminCourseSummary,
  AdminChapterQuiz,
  AdminFinalTestAnalytics,
  AdminQuizAnalytics,
  AdminCourseFinalTest,
  Chapter,
  Course,
  CoursesResponse,
  CreateChapterRequest,
  CreateCourseRequest,
  CreatePedagogicalContentRequest,
  CreateSubChapterRequest,
  LearnerCourseFinalTest,
  LearnerChapterQuiz,
  PedagogicalContent,
  SubmitCourseFinalTestAttemptRequest,
  SubmitCourseFinalTestAttemptResponse,
  SubmitChapterQuizAttemptRequest,
  SubmitChapterQuizAttemptResponse,
  SubChapter,
  UpsertChapterQuizRequest,
  UpsertCourseFinalTestRequest,
  UpdateChapterRequest,
  UpdateCourseRequest,
  UpdatePedagogicalContentRequest,
  UpdateSubChapterRequest,
  UploadCourseCoverResponse,
  UploadCourseMediaResponse,
} from './course.types';

const uploadCourseFile = async <TResponse>(endpoint: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<TResponse>(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const courseService = {
  async getPublishedCourses(limit = 50, offset = 0): Promise<CoursesResponse> {
    const response = await apiClient.get<CoursesResponse>('/courses', {
      params: { limit, offset },
    });
    return response.data;
  },

  async getCourseById(id: string): Promise<Course> {
    const response = await apiClient.get<Course>(`/courses/${id}`);
    return response.data;
  },

  async getFreeCourses(): Promise<Course[]> {
    const response = await this.getPublishedCourses(50, 0);
    return response.data.filter((course) => course.level === 'free');
  },

  async getPremiumCourses(): Promise<Course[]> {
    const response = await this.getPublishedCourses(50, 0);
    return response.data.filter((course) => course.level === 'premium');
  },

  async getAdminSummary(): Promise<AdminCourseSummary> {
    const response = await apiClient.get<AdminCourseSummary>('/courses/admin/summary');
    return response.data;
  },

  async getAdminCourses(limit = 20, offset = 0): Promise<CoursesResponse> {
    const response = await apiClient.get<CoursesResponse>('/courses/admin/list', {
      params: { limit, offset },
    });
    return response.data;
  },

  async createCourse(payload: CreateCourseRequest): Promise<Course> {
    const response = await apiClient.post<Course>('/courses', payload);
    return response.data;
  },

  async updateCourse(id: string, payload: UpdateCourseRequest): Promise<Course> {
    const response = await apiClient.put<Course>(`/courses/${id}`, payload);
    return response.data;
  },

  async deleteCourse(id: string): Promise<void> {
    await apiClient.delete(`/courses/${id}`);
  },

  async createChapter(
    courseId: string,
    payload: CreateChapterRequest,
  ): Promise<Chapter> {
    const response = await apiClient.post<Chapter>(
      `/courses/${courseId}/chapters`,
      payload,
    );
    return response.data;
  },

  async updateChapter(
    courseId: string,
    chapterId: string,
    payload: UpdateChapterRequest,
  ): Promise<Chapter> {
    const response = await apiClient.put<Chapter>(
      `/courses/${courseId}/chapters/${chapterId}`,
      payload,
    );
    return response.data;
  },

  async deleteChapter(courseId: string, chapterId: string): Promise<void> {
    await apiClient.delete(`/courses/${courseId}/chapters/${chapterId}`);
  },

  async createSubChapter(
    courseId: string,
    chapterId: string,
    payload: CreateSubChapterRequest,
  ): Promise<SubChapter> {
    const response = await apiClient.post<SubChapter>(
      `/courses/${courseId}/chapters/${chapterId}/sub-chapters`,
      payload,
    );
    return response.data;
  },

  async updateSubChapter(
    courseId: string,
    chapterId: string,
    subChapterId: string,
    payload: UpdateSubChapterRequest,
  ): Promise<SubChapter> {
    const response = await apiClient.put<SubChapter>(
      `/courses/${courseId}/chapters/${chapterId}/sub-chapters/${subChapterId}`,
      payload,
    );
    return response.data;
  },

  async deleteSubChapter(
    courseId: string,
    chapterId: string,
    subChapterId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/courses/${courseId}/chapters/${chapterId}/sub-chapters/${subChapterId}`,
    );
  },

  async createPedagogicalContent(
    courseId: string,
    chapterId: string,
    subChapterId: string,
    payload: CreatePedagogicalContentRequest,
  ): Promise<PedagogicalContent> {
    const response = await apiClient.post<PedagogicalContent>(
      `/courses/${courseId}/chapters/${chapterId}/sub-chapters/${subChapterId}/pedagogical-contents`,
      payload,
    );
    return response.data;
  },

  async updatePedagogicalContent(
    courseId: string,
    chapterId: string,
    subChapterId: string,
    contentId: string,
    payload: UpdatePedagogicalContentRequest,
  ): Promise<PedagogicalContent> {
    const response = await apiClient.put<PedagogicalContent>(
      `/courses/${courseId}/chapters/${chapterId}/sub-chapters/${subChapterId}/pedagogical-contents/${contentId}`,
      payload,
    );
    return response.data;
  },

  async deletePedagogicalContent(
    courseId: string,
    chapterId: string,
    subChapterId: string,
    contentId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/courses/${courseId}/chapters/${chapterId}/sub-chapters/${subChapterId}/pedagogical-contents/${contentId}`,
    );
  },

  async getChapterQuiz(
    courseId: string,
    chapterId: string,
  ): Promise<AdminChapterQuiz | LearnerChapterQuiz | null> {
    const response = await apiClient.get<AdminChapterQuiz | LearnerChapterQuiz | null>(
      `/courses/${courseId}/chapters/${chapterId}/quiz`,
    );
    return response.data;
  },

  async getChapterQuizAnalytics(
    courseId: string,
    chapterId: string,
  ): Promise<AdminQuizAnalytics | null> {
    const response = await apiClient.get<AdminQuizAnalytics | null>(
      `/courses/${courseId}/chapters/${chapterId}/quiz/analytics`,
    );
    return response.data;
  },

  async upsertChapterQuiz(
    courseId: string,
    chapterId: string,
    payload: UpsertChapterQuizRequest,
  ): Promise<AdminChapterQuiz> {
    const response = await apiClient.put<AdminChapterQuiz>(
      `/courses/${courseId}/chapters/${chapterId}/quiz`,
      payload,
    );
    return response.data;
  },

  async deleteChapterQuiz(courseId: string, chapterId: string): Promise<void> {
    await apiClient.delete(`/courses/${courseId}/chapters/${chapterId}/quiz`);
  },

  async submitChapterQuizAttempt(
    courseId: string,
    chapterId: string,
    payload: SubmitChapterQuizAttemptRequest,
  ): Promise<SubmitChapterQuizAttemptResponse> {
    const response = await apiClient.post<SubmitChapterQuizAttemptResponse>(
      `/courses/${courseId}/chapters/${chapterId}/quiz/attempts`,
      payload,
    );
    return response.data;
  },

  async getCourseFinalTest(
    courseId: string,
  ): Promise<AdminCourseFinalTest | LearnerCourseFinalTest | null> {
    const response = await apiClient.get<
      AdminCourseFinalTest | LearnerCourseFinalTest | null
    >(`/courses/${courseId}/final-test`);
    return response.data;
  },

  async upsertCourseFinalTest(
    courseId: string,
    payload: UpsertCourseFinalTestRequest,
  ): Promise<AdminCourseFinalTest> {
    const response = await apiClient.put<AdminCourseFinalTest>(
      `/courses/${courseId}/final-test`,
      payload,
    );
    return response.data;
  },

  async getCourseFinalTestAnalytics(
    courseId: string,
  ): Promise<AdminFinalTestAnalytics | null> {
    const response = await apiClient.get<AdminFinalTestAnalytics | null>(
      `/courses/${courseId}/final-test/analytics`,
    );
    return response.data;
  },

  async deleteCourseFinalTest(courseId: string): Promise<void> {
    await apiClient.delete(`/courses/${courseId}/final-test`);
  },

  async submitCourseFinalTestAttempt(
    courseId: string,
    payload: SubmitCourseFinalTestAttemptRequest,
  ): Promise<SubmitCourseFinalTestAttemptResponse> {
    const response = await apiClient.post<SubmitCourseFinalTestAttemptResponse>(
      `/courses/${courseId}/final-test/attempts`,
      payload,
    );
    return response.data;
  },

  async uploadCourseCover(file: File): Promise<UploadCourseCoverResponse> {
    return uploadCourseFile<UploadCourseCoverResponse>(
      '/courses/admin/upload-cover',
      file,
    );
  },

  async uploadCourseMedia(file: File): Promise<UploadCourseMediaResponse> {
    return uploadCourseFile<UploadCourseMediaResponse>(
      '/courses/admin/upload-media',
      file,
    );
  },
};

export default courseService;
