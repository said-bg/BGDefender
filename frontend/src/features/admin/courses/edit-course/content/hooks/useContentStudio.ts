import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { buildCoursePreviewHref } from '@/features/admin/courses/edit-course/shared/coursePreview.utils';
import courseService, {
  Chapter,
  Course,
  PedagogicalContent,
  SubChapter,
} from '@/services/course';
import type { TranslationFn } from '@/types/i18n';
import { getApiErrorMessage } from '@/utils/apiError';
import { sortByOrderIndex } from '@/features/admin/courses/edit-course/shared/EditCourseState.utils';
import {
  buildFreshContentForm,
  ContentBlockFormState,
  initialContentBlockForm,
  normalizeCourseForContentStudio,
} from '../lib/content.utils';
import { deleteContentMutation, submitContentMutation } from '../mutations/contentStudio.mutations';

export type EditorLocale = 'en' | 'fi';

type UseContentStudioParams = {
  courseId?: string;
  language: string;
  t: TranslationFn;
};

export function useContentStudio({ courseId, language, t }: UseContentStudioParams) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeEditorLocale, setActiveEditorLocale] = useState<EditorLocale>('en');
  const [contentForm, setContentForm] = useState<ContentBlockFormState>(initialContentBlockForm);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [contentMessage, setContentMessage] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [isSubmittingContent, setIsSubmittingContent] = useState(false);
  const [deletingContentId, setDeletingContentId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const requestedChapterId = searchParams?.get('chapter');
  const requestedSubChapterId = searchParams?.get('subChapter');

  useEffect(() => {
    if (!courseId) {
      setLoadError(
        t('edit.contentBlocks.missingCourseId', { defaultValue: 'Missing course id.' }),
      );
      setLoadingPage(false);
      return;
    }

    const loadCourse = async () => {
      try {
        setLoadingPage(true);
        setLoadError(null);
        const response = await courseService.getAdminCourseById(courseId);
        setCourse(normalizeCourseForContentStudio(response));
      } catch (error) {
        setLoadError(
          getApiErrorMessage(
            error,
            t('edit.failedToLoad', { defaultValue: 'Failed to load course data.' }),
          ),
        );
      } finally {
        setLoadingPage(false);
      }
    };

    void loadCourse();
  }, [courseId, t]);

  const localizedCourseTitle = useMemo(() => {
    if (!course) {
      return '';
    }

    return language === 'fi' ? course.titleFi : course.titleEn;
  }, [course, language]);

  const chapters = useMemo(() => (course ? sortByOrderIndex(course.chapters) : []), [course]);
  const activeChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === contentForm.chapterId) ?? chapters[0] ?? null,
    [chapters, contentForm.chapterId],
  );
  const activeSubChapter = useMemo(
    () =>
      activeChapter?.subChapters.find((subChapter) => subChapter.id === contentForm.subChapterId) ??
      activeChapter?.subChapters[0] ??
      null,
    [activeChapter, contentForm.subChapterId],
  );
  const contentBlocks = useMemo(
    () => (activeSubChapter ? sortByOrderIndex(activeSubChapter.pedagogicalContents) : []),
    [activeSubChapter],
  );

  useEffect(() => {
    if (contentForm.chapterId || chapters.length === 0) {
      return;
    }

    const chapterFromRequestedSubChapter =
      requestedSubChapterId
        ? chapters.find((chapter) =>
            chapter.subChapters.some((subChapter) => subChapter.id === requestedSubChapterId),
          ) ?? null
        : null;
    const initialChapter =
      chapterFromRequestedSubChapter ??
      chapters.find((chapter) => chapter.id === requestedChapterId) ??
      chapters[0] ??
      null;
    const initialSubChapter =
      initialChapter?.subChapters.find(
        (subChapter) => subChapter.id === requestedSubChapterId,
      ) ??
      initialChapter?.subChapters[0] ??
      null;

    setContentForm(buildFreshContentForm(initialChapter, initialSubChapter));
  }, [chapters, contentForm.chapterId, requestedChapterId, requestedSubChapterId]);

  useEffect(() => {
    if (!pathname || !activeChapter || !contentForm.chapterId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams?.toString() ?? '');
    nextParams.set('chapter', activeChapter.id);

    if (activeSubChapter) {
      nextParams.set('subChapter', activeSubChapter.id);
    } else {
      nextParams.delete('subChapter');
    }

    const nextQuery = nextParams.toString();
    const currentQuery = searchParams?.toString() ?? '';

    if (nextQuery !== currentQuery) {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }
  }, [activeChapter, activeSubChapter, contentForm.chapterId, pathname, router, searchParams]);

  const resetContentForm = (
    chapter: Chapter | null = activeChapter,
    subChapter: SubChapter | null = activeSubChapter,
  ) => {
    setEditingContentId(null);
    setContentForm(buildFreshContentForm(chapter, subChapter));
  };

  const selectSubChapter = (chapter: Chapter, subChapter: SubChapter) => {
    setContentMessage(null);
    setContentError(null);
    resetContentForm(chapter, subChapter);
  };

  const startEditingContent = (
    chapter: Chapter,
    subChapter: SubChapter,
    content: PedagogicalContent,
  ) => {
    setContentMessage(null);
    setContentError(null);
    setEditingContentId(content.id);
    setContentForm({
      chapterId: chapter.id,
      subChapterId: subChapter.id,
      titleEn: content.titleEn,
      titleFi: content.titleFi,
      contentEn: content.contentEn ?? '',
      contentFi: content.contentFi ?? '',
      orderIndex: String(content.orderIndex),
    });
  };

  const startNewBlock = () => {
    setContentMessage(null);
    setContentError(null);
    resetContentForm(activeChapter, activeSubChapter);
  };

  const submitContent = async (draftForm: ContentBlockFormState) =>
    submitContentMutation({
      contentForm: draftForm,
      courseId,
      editingContentId,
      resetContentForm,
      setContentError,
      setContentMessage,
      setCourse,
      setIsSubmittingContent,
      t,
    });

  const deleteContent = async (chapterId: string, subChapterId: string, contentId: string) =>
    deleteContentMutation({
      chapterId,
      contentId,
      courseId,
      editingContentId,
      resetContentForm,
      setContentError,
      setContentMessage,
      setCourse,
      setDeletingContentId,
      subChapterId,
      t,
    });

  const returnTo = useMemo(() => {
    if (!pathname) {
      return undefined;
    }

    const nextParams = new URLSearchParams(searchParams?.toString() ?? '');

    if (activeChapter) {
      nextParams.set('chapter', activeChapter.id);
    }

    if (activeSubChapter) {
      nextParams.set('subChapter', activeSubChapter.id);
    } else {
      nextParams.delete('subChapter');
    }

    const nextQuery = nextParams.toString();
    return `${pathname}${nextQuery ? `?${nextQuery}` : ''}`;
  }, [activeChapter, activeSubChapter, pathname, searchParams]);
  const previewHref = useMemo(() => {
    if (!courseId) {
      return null;
    }

    if (activeChapter && activeSubChapter) {
      return buildCoursePreviewHref(courseId, {
        returnTo,
        target: {
          type: 'subchapter',
          chapterId: activeChapter.id,
          subChapterId: activeSubChapter.id,
        },
      });
    }

    if (activeChapter) {
      return buildCoursePreviewHref(courseId, {
        returnTo,
        target: { type: 'chapter', chapterId: activeChapter.id },
      });
    }

    return buildCoursePreviewHref(courseId, {
      returnTo,
      target: { type: 'overview' },
    });
  }, [activeChapter, activeSubChapter, courseId, returnTo]);

  return {
    activeChapter,
    activeEditorLocale,
    activeSubChapter,
    chapters,
    contentBlocks,
    contentError,
    contentForm,
    contentMessage,
    course,
    deletingContentId,
    editingContentId,
    isSidebarOpen,
    isSubmittingContent,
    loadError,
    loadingPage,
    localizedCourseTitle,
    previewHref,
    setActiveEditorLocale,
    setIsSidebarOpen,
    deleteContent,
    resetContentForm,
    selectSubChapter,
    startEditingContent,
    startNewBlock,
    submitContent,
  };
}

