import type { PedagogicalContent } from '@/services/course';

export type ActiveLanguage = 'en' | 'fi';

export type ViewState =
  | { type: 'overview' }
  | { type: 'chapter'; chapterId: string }
  | { type: 'subchapter'; chapterId: string; subChapterId: string }
  | { type: 'quiz'; chapterId: string }
  | { type: 'final-test' };

export type SelectedContent = {
  kind: 'overview' | 'chapter' | 'subchapter' | 'quiz' | 'final-test';
  title: string;
  description: string;
  paragraphs: string[];
  parentTitle?: string;
  contentBlocks?: PedagogicalContent[];
  chapterId?: string;
  passingScore?: number;
};

export type NavigationItem = {
  key: string;
  view: ViewState;
};

export type CourseDetailErrorKey = 'courseNotFound' | 'unableToLoad' | null;

export type CourseAccessState =
  | 'public'
  | 'checking'
  | 'login_required'
  | 'premium_required'
  | 'granted';

