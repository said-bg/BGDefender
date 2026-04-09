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
  createdAt: string;
  updatedAt: string;
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

export interface SubChapter {
  id: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  orderIndex: number;
  pedagogicalContents: PedagogicalContent[];
}

export type PedagogicalContentType =
  | 'text'
  | 'video'
  | 'image'
  | 'link'
  | 'pdf'
  | 'quiz';

export interface PedagogicalContent {
  id: string;
  titleEn: string;
  titleFi: string;
  type: PedagogicalContentType;
  contentEn: string | null;
  contentFi: string | null;
  url: string | null;
  orderIndex: number;
}

export interface CoursesResponse {
  data: Course[];
  count: number;
}

export interface AdminCourseSummary {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  archivedCourses: number;
}

export interface CreateCourseRequest {
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  level?: 'free' | 'premium';
  status?: 'draft' | 'published' | 'archived';
  estimatedDuration?: number;
  coverImage?: string;
  authorIds?: string[];
}

export interface UpdateCourseRequest {
  titleEn?: string;
  titleFi?: string;
  descriptionEn?: string;
  descriptionFi?: string;
  level?: 'free' | 'premium';
  status?: 'draft' | 'published' | 'archived';
  estimatedDuration?: number;
  coverImage?: string;
  authorIds?: string[];
}

export interface CreateChapterRequest {
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  orderIndex: number;
}

export interface UpdateChapterRequest {
  titleEn?: string;
  titleFi?: string;
  descriptionEn?: string;
  descriptionFi?: string;
  orderIndex?: number;
}

export interface CreateSubChapterRequest {
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  orderIndex: number;
}

export interface UpdateSubChapterRequest {
  titleEn?: string;
  titleFi?: string;
  descriptionEn?: string;
  descriptionFi?: string;
  orderIndex?: number;
}

export interface CreatePedagogicalContentRequest {
  titleEn: string;
  titleFi: string;
  type: PedagogicalContentType;
  contentEn?: string;
  contentFi?: string;
  url?: string;
  orderIndex: number;
}

export interface UpdatePedagogicalContentRequest {
  titleEn?: string;
  titleFi?: string;
  type?: PedagogicalContentType;
  contentEn?: string;
  contentFi?: string;
  url?: string;
  orderIndex?: number;
}

export interface UploadCourseCoverResponse {
  statusCode: number;
  url: string;
  filename: string;
}

export interface UploadCourseMediaResponse {
  statusCode: number;
  url: string;
  filename: string;
}