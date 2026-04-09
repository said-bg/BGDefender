import type { PedagogicalContent } from '@/services/courseService';

export type ActiveLanguage = 'en' | 'fi';

export type ViewState =
  | { type: 'overview' }
  | { type: 'chapter'; chapterId: string }
  | { type: 'subchapter'; chapterId: string; subChapterId: string };

export type SelectedContent = {
  kind: 'overview' | 'chapter' | 'subchapter';
  title: string;
  description: string;
  paragraphs: string[];
  parentTitle?: string;
  contentBlocks?: PedagogicalContent[];
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