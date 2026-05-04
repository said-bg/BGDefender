export type AdminCoursePreviewTarget =
  | { type: 'overview' }
  | { type: 'chapter'; chapterId: string }
  | { type: 'subchapter'; chapterId: string; subChapterId: string }
  | { type: 'quiz'; chapterId: string }
  | { type: 'final-test' };

type BuildCoursePreviewHrefOptions = {
  focus?: 'entry' | 'content';
  returnTo?: string;
  sidebarMode?: 'default' | 'structure';
  target?: AdminCoursePreviewTarget;
};

export const buildCoursePreviewHref = (
  courseId: string,
  options: BuildCoursePreviewHrefOptions = {},
) => {
  const params = new URLSearchParams();
  const target = options.target ?? { type: 'overview' };

  params.set('preview', '1');

  if (target.type !== 'overview') {
    params.set('view', target.type);
  }

  if ('chapterId' in target) {
    params.set('chapterId', target.chapterId);
  }

  if ('subChapterId' in target) {
    params.set('subChapterId', target.subChapterId);
  }

  if (options.returnTo) {
    params.set('returnTo', options.returnTo);
  }

  if (options.focus && options.focus !== 'entry') {
    params.set('focus', options.focus);
  }

  if (options.sidebarMode && options.sidebarMode !== 'default') {
    params.set('sidebar', options.sidebarMode);
  }

  return `/courses/${courseId}?${params.toString()}`;
};
