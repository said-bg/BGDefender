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
  finalTests?: FinalTestSummary[];
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
  trainingQuiz?: TrainingQuizSummary | null;
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

export type QuizQuestionType = 'single_choice' | 'multiple_choice';

export interface TrainingQuizSummary {
  id: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
}

export interface FinalTestSummary {
  id: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
}

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

export interface QuizOption {
  id: string;
  labelEn: string;
  labelFi: string;
  orderIndex: number;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  promptEn: string;
  promptFi: string;
  explanationEn: string | null;
  explanationFi: string | null;
  type: QuizQuestionType;
  orderIndex: number;
  options: QuizOption[];
}

export interface QuizAttemptSummary {
  id: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
  submittedAt: string;
}

export interface AdminChapterQuiz {
  id: string;
  chapterId: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
  questions: QuizQuestion[];
  stats: {
    attemptCount: number;
    latestAttemptAt: string | null;
    bestScore: number | null;
  };
}

export interface LearnerChapterQuiz {
  id: string;
  chapterId: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
  questions: QuizQuestion[];
  latestAttempt: QuizAttemptSummary | null;
  bestAttempt: QuizAttemptSummary | null;
}

export interface AdminCourseFinalTest {
  id: string;
  courseId: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
  questions: QuizQuestion[];
  stats: {
    attemptCount: number;
    latestAttemptAt: string | null;
    bestScore: number | null;
  };
}

export interface LearnerCourseFinalTest {
  id: string;
  courseId: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
  isUnlocked: boolean;
  certificate: {
    id: string;
    status: 'pending_profile' | 'issued';
    issuedAt: string | null;
  } | null;
  questions: QuizQuestion[];
  latestAttempt: QuizAttemptSummary | null;
  bestAttempt: QuizAttemptSummary | null;
}

export interface UpsertQuizOptionRequest {
  labelEn: string;
  labelFi: string;
  orderIndex: number;
  isCorrect: boolean;
}

export interface UpsertQuizQuestionRequest {
  promptEn: string;
  promptFi: string;
  explanationEn?: string | null;
  explanationFi?: string | null;
  type: QuizQuestionType;
  orderIndex: number;
  options: UpsertQuizOptionRequest[];
}

export interface UpsertChapterQuizRequest {
  titleEn: string;
  titleFi: string;
  descriptionEn?: string | null;
  descriptionFi?: string | null;
  passingScore: number;
  isPublished: boolean;
  questions: UpsertQuizQuestionRequest[];
}

export type UpsertCourseFinalTestRequest = UpsertChapterQuizRequest;

export interface SubmitQuizAttemptAnswerRequest {
  questionId: string;
  selectedOptionIds: string[];
}

export interface SubmitChapterQuizAttemptRequest {
  answers: SubmitQuizAttemptAnswerRequest[];
}

export interface SubmitChapterQuizAttemptResponse {
  attempt: QuizAttemptSummary;
  latestAttempt: QuizAttemptSummary;
  bestAttempt: QuizAttemptSummary;
}

export type SubmitCourseFinalTestAttemptRequest =
  SubmitChapterQuizAttemptRequest;

export type SubmitCourseFinalTestAttemptResponse =
  SubmitChapterQuizAttemptResponse;

export interface CoursesResponse {
  data: Course[];
  count: number;
}

export interface CourseCollection {
  id: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  orderIndex: number;
  isPublished: boolean;
  courses: Course[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseCollectionRequest {
  titleEn: string;
  titleFi: string;
  descriptionEn?: string | null;
  descriptionFi?: string | null;
  orderIndex?: number;
  isPublished?: boolean;
  courseIds?: string[];
}

export type UpdateCourseCollectionRequest = CreateCourseCollectionRequest;

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
  status?: 'draft' | 'published';
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
  status?: 'draft' | 'published';
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
