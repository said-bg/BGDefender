import { apiClient } from './api';

export interface Course {
  id: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  level: 'free' | 'premium';
  status: string;
  estimatedDuration: number;
  coverImage: string;
  authors: Author[];
  chapters: Chapter[];
  createdAt: string;
  updatedAt: string;
}

export interface Author {
  id: string;
  name: string;
  roleEn?: string;
  roleFi?: string;
  biographyEn?: string;
  biographyFi?: string;
  photo?: string;
}

export interface Chapter {
  id: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  orderIndex: number;
  subChapters: SubChapter[];
}

export interface PedagogicalContent {
  id: string;
  titleEn: string;
  titleFi: string;
  type: string;
  contentEn: string | null;
  contentFi: string | null;
  url: string | null;
  orderIndex: number;
}

export interface SubChapter {
  id: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  orderIndex: number;
  pedagogicalContents: PedagogicalContent[];
}

export interface CoursesResponse {
  data: Course[];
  count: number;
}

export const courseService = {
  /**
   * Fetch published courses with pagination
   */
  async getPublishedCourses(limit = 50, offset = 0): Promise<CoursesResponse> {
    try {
      const response = await apiClient.get<CoursesResponse>('/courses', {
        params: {
          limit,
          offset,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      throw error;
    }
  },

  /**
   * Fetch a single course by ID
   */
  async getCourseById(id: string): Promise<Course> {
    try {
      const response = await apiClient.get<Course>(`/courses/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch course ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get FREE courses only
   */
  async getFreeCourses(): Promise<Course[]> {
    const response = await this.getPublishedCourses(50, 0);
    return response.data.filter((course) => course.level === 'free');
  },

  /**
   * Get PREMIUM courses only
   */
  async getPremiumCourses(): Promise<Course[]> {
    const response = await this.getPublishedCourses(50, 0);
    return response.data.filter((course) => course.level === 'premium');
  },
};

export default courseService;
