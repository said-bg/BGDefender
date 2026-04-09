'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import courseService, {
  AdminChapterQuiz,
  Chapter,
  Course,
  QuizQuestionType,
  UpsertChapterQuizRequest,
} from '@/services/courseService';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  EditCourseErrorState,
  EditCourseLoadingState,
  EditCourseProtected,
  EditCourseShell,
  useEditCourseId,
} from '@/features/admin/courses/edit-course/shared/EditCourseShared';
import formStyles from '@/features/admin/courses/edit-course/shared/EditCourseForm.module.css';
import sharedStyles from '@/features/admin/courses/edit-course/shared/EditCoursePage.module.css';
import sidebarStyles from '@/features/admin/courses/edit-course/shared/EditCourseSidebar.module.css';
import shellStyles from '@/features/admin/courses/edit-course/shared/EditCourseShell.module.css';
import featureStyles from './QuizPage.module.css';

const styles = {
  ...formStyles,
  ...sharedStyles,
  ...sidebarStyles,
  ...shellStyles,
  ...featureStyles,
};

type QuizOptionDraft = {
  id: string;
  labelEn: string;
  labelFi: string;
  isCorrect: boolean;
};

type QuizQuestionDraft = {
  id: string;
  promptEn: string;
  promptFi: string;
  explanationEn: string;
  explanationFi: string;
  type: QuizQuestionType;
  options: QuizOptionDraft[];
};

type QuizFormState = {
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  passingScore: string;
  isPublished: boolean;
  questions: QuizQuestionDraft[];
};

const createDraftId = () => Math.random().toString(36).slice(2, 10);

const createOptionDraft = (
  overrides?: Partial<QuizOptionDraft>,
): QuizOptionDraft => ({
  id: createDraftId(),
  labelEn: '',
  labelFi: '',
  isCorrect: false,
  ...overrides,
});

const createQuestionDraft = (
  overrides?: Partial<QuizQuestionDraft>,
): QuizQuestionDraft => ({
  id: createDraftId(),
  promptEn: '',
  promptFi: '',
  explanationEn: '',
  explanationFi: '',
  type: 'single_choice',
  options: [createOptionDraft({ isCorrect: true }), createOptionDraft()],
  ...overrides,
});

const createEmptyQuizForm = (chapter: Chapter | null): QuizFormState => ({
  titleEn: chapter ? `${chapter.titleEn} training quiz` : '',
  titleFi: chapter ? `${chapter.titleFi} training quiz` : '',
  descriptionEn: '',
  descriptionFi: '',
  passingScore: '70',
  isPublished: false,
  questions: [createQuestionDraft()],
});

const mapQuizToForm = (quiz: AdminChapterQuiz): QuizFormState => ({
  titleEn: quiz.titleEn,
  titleFi: quiz.titleFi,
  descriptionEn: quiz.descriptionEn ?? '',
  descriptionFi: quiz.descriptionFi ?? '',
  passingScore: String(quiz.passingScore),
  isPublished: quiz.isPublished,
  questions: quiz.questions.map((question) => ({
    id: question.id,
    promptEn: question.promptEn,
    promptFi: question.promptFi,
    explanationEn: question.explanationEn ?? '',
    explanationFi: question.explanationFi ?? '',
    type: question.type,
    options: question.options.map((option) => ({
      id: option.id,
      labelEn: option.labelEn,
      labelFi: option.labelFi,
      isCorrect: Boolean(option.isCorrect),
    })),
  })),
});

const sortChapters = (course: Course): Course => ({
  ...course,
  chapters: [...course.chapters].sort((left, right) => left.orderIndex - right.orderIndex),
});

export default function QuizPage() {
  return (
    <EditCourseProtected>
      <QuizPageContent />
    </EditCourseProtected>
  );
}

function QuizPageContent() {
  const { t, i18n } = useTranslation('admin');
  const courseId = useEditCourseId();
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizMessage, setQuizMessage] = useState<string | null>(null);
  const [loadedQuiz, setLoadedQuiz] = useState<AdminChapterQuiz | null>(null);
  const [quizForm, setQuizForm] = useState<QuizFormState>(createEmptyQuizForm(null));
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);

  useEffect(() => {
    if (!courseId) {
      setLoadError(
        t('edit.chapters.missingCourseId', {
          defaultValue: 'Missing course id.',
        }),
      );
      setLoadingPage(false);
      return;
    }

    const loadCourse = async () => {
      try {
        setLoadingPage(true);
        setLoadError(null);
        const response = await courseService.getCourseById(courseId);
        const normalizedCourse = sortChapters(response);
        setCourse(normalizedCourse);
        setSelectedChapterId((previous) => previous ?? normalizedCourse.chapters[0]?.id ?? null);
      } catch (error) {
        setLoadError(
          getApiErrorMessage(
            error,
            t('edit.failedToLoad', {
              defaultValue: 'Failed to load course data.',
            }),
          ),
        );
      } finally {
        setLoadingPage(false);
      }
    };

    void loadCourse();
  }, [courseId, t]);

  const chapters = useMemo(
    () => (course ? [...course.chapters].sort((left, right) => left.orderIndex - right.orderIndex) : []),
    [course],
  );
  const selectedChapter = chapters.find((chapter) => chapter.id === selectedChapterId) ?? null;

  const localizedCourseTitle = useMemo(() => {
    if (!course) {
      return '';
    }

    return i18n.language === 'fi' ? course.titleFi : course.titleEn;
  }, [course, i18n.language]);

  const syncChapterQuizSummary = useCallback((chapterId: string, quiz: AdminChapterQuiz | null) => {
    setCourse((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        chapters: previous.chapters.map((chapter) =>
          chapter.id === chapterId
            ? {
                ...chapter,
                trainingQuiz: quiz
                  ? {
                      id: quiz.id,
                      titleEn: quiz.titleEn,
                      titleFi: quiz.titleFi,
                      descriptionEn: quiz.descriptionEn,
                      descriptionFi: quiz.descriptionFi,
                      passingScore: quiz.passingScore,
                      isPublished: quiz.isPublished,
                    }
                  : null,
              }
            : chapter,
        ),
      };
    });
  }, []);

  useEffect(() => {
    if (!courseId || !selectedChapterId || !selectedChapter) {
      return;
    }

    const loadQuiz = async () => {
      try {
        setQuizLoading(true);
        setQuizError(null);
        setQuizMessage(null);
        const response = await courseService.getChapterQuiz(courseId, selectedChapterId);
        const adminQuiz = response && 'stats' in response ? response : null;
        setLoadedQuiz(adminQuiz);
        setQuizForm(adminQuiz ? mapQuizToForm(adminQuiz) : createEmptyQuizForm(selectedChapter));
      } catch (error) {
        setQuizError(
          getApiErrorMessage(
            error,
            t('edit.quiz.failedToLoad', {
              defaultValue: 'Failed to load chapter quiz.',
            }),
          ),
        );
      } finally {
        setQuizLoading(false);
      }
    };

    void loadQuiz();
  }, [courseId, selectedChapter, selectedChapterId, t]);

  const updateQuestion = (
    questionId: string,
    updater: (question: QuizQuestionDraft) => QuizQuestionDraft,
  ) => {
    setQuizForm((previous) => ({
      ...previous,
      questions: previous.questions.map((question) =>
        question.id === questionId ? updater(question) : question,
      ),
    }));
  };

  const handleQuestionTypeChange = (questionId: string, nextType: QuizQuestionType) => {
    updateQuestion(questionId, (question) => {
      const firstCorrectIndex = question.options.findIndex((option) => option.isCorrect);
      return {
        ...question,
        type: nextType,
        options:
          nextType === 'single_choice'
            ? question.options.map((option, index) => ({
                ...option,
                isCorrect: index === (firstCorrectIndex >= 0 ? firstCorrectIndex : 0),
              }))
            : question.options,
      };
    });
  };

  const toggleOptionCorrect = (questionId: string, optionId: string, checked: boolean) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      options: question.options.map((option) => {
        if (question.type === 'single_choice') {
          return {
            ...option,
            isCorrect: option.id === optionId ? checked : false,
          };
        }

        return option.id === optionId ? { ...option, isCorrect: checked } : option;
      }),
    }));
  };

  const addQuestion = () => {
    setQuizForm((previous) => ({
      ...previous,
      questions: [...previous.questions, createQuestionDraft()],
    }));
  };

  const removeQuestion = (questionId: string) => {
    setQuizForm((previous) => ({
      ...previous,
      questions:
        previous.questions.length > 1
          ? previous.questions.filter((question) => question.id !== questionId)
          : previous.questions,
    }));
  };

  const addOption = (questionId: string) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      options: [...question.options, createOptionDraft()],
    }));
  };

  const removeOption = (questionId: string, optionId: string) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      options:
        question.options.length > 2
          ? question.options.filter((option) => option.id !== optionId)
          : question.options,
    }));
  };

  const resetCurrentForm = () => {
    setQuizError(null);
    setQuizMessage(null);
    setQuizForm(loadedQuiz ? mapQuizToForm(loadedQuiz) : createEmptyQuizForm(selectedChapter));
  };

  const handleSaveQuiz = async () => {
    if (!courseId || !selectedChapterId) {
      return;
    }

    try {
      setIsSavingQuiz(true);
      setQuizError(null);
      setQuizMessage(null);

      const payload: UpsertChapterQuizRequest = {
        titleEn: quizForm.titleEn.trim(),
        titleFi: quizForm.titleFi.trim(),
        descriptionEn: quizForm.descriptionEn.trim() || null,
        descriptionFi: quizForm.descriptionFi.trim() || null,
        passingScore: Number(quizForm.passingScore),
        isPublished: quizForm.isPublished,
        questions: quizForm.questions.map((question, questionIndex) => ({
          promptEn: question.promptEn.trim(),
          promptFi: question.promptFi.trim(),
          explanationEn: question.explanationEn.trim() || null,
          explanationFi: question.explanationFi.trim() || null,
          type: question.type,
          orderIndex: questionIndex + 1,
          options: question.options.map((option, optionIndex) => ({
            labelEn: option.labelEn.trim(),
            labelFi: option.labelFi.trim(),
            isCorrect: option.isCorrect,
            orderIndex: optionIndex + 1,
          })),
        })),
      };

      const savedQuiz = await courseService.upsertChapterQuiz(courseId, selectedChapterId, payload);
      setLoadedQuiz(savedQuiz);
      setQuizForm(mapQuizToForm(savedQuiz));
      syncChapterQuizSummary(selectedChapterId, savedQuiz);
      setQuizMessage(
        t('edit.quiz.saved', {
          defaultValue: 'Training quiz saved successfully.',
        }),
      );
    } catch (error) {
      setQuizError(
        getApiErrorMessage(
          error,
          t('edit.quiz.saveFailed', {
            defaultValue: 'Failed to save training quiz.',
          }),
        ),
      );
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!courseId || !selectedChapterId || !loadedQuiz) {
      return;
    }

    const confirmed = window.confirm(
      t('edit.quiz.deleteConfirm', {
        defaultValue: 'Delete this training quiz? This action cannot be undone.',
      }),
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingQuiz(true);
      setQuizError(null);
      setQuizMessage(null);
      await courseService.deleteChapterQuiz(courseId, selectedChapterId);
      setLoadedQuiz(null);
      setQuizForm(createEmptyQuizForm(selectedChapter));
      syncChapterQuizSummary(selectedChapterId, null);
      setQuizMessage(
        t('edit.quiz.deleted', {
          defaultValue: 'Training quiz deleted successfully.',
        }),
      );
    } catch (error) {
      setQuizError(
        getApiErrorMessage(
          error,
          t('edit.quiz.deleteFailed', {
            defaultValue: 'Failed to delete training quiz.',
          }),
        ),
      );
    } finally {
      setIsDeletingQuiz(false);
    }
  };

  if (loadingPage) {
    return <EditCourseLoadingState />;
  }

  if (loadError || !courseId || !course) {
    return (
      <EditCourseErrorState
        message={
          loadError ||
          t('edit.chapters.missingCourseId', {
            defaultValue: 'Missing course id.',
          })
        }
      />
    );
  }

  return (
    <EditCourseShell
      courseId={courseId}
      section="quiz"
      title={t('edit.tabs.quiz', { defaultValue: 'Training quiz' })}
      subtitle={t('edit.quiz.subtitle', {
        defaultValue:
          'Attach one scored training quiz to each chapter. These quizzes can include single-choice and multiple-choice questions with a passing percentage.',
      })}
      courseTitle={localizedCourseTitle}
      wide
    >
      <section className={styles.formCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.sectionTitle}>
            {t('edit.quiz.title', { defaultValue: 'Chapter training quizzes' })}
          </h2>
          <p className={styles.sectionDescription}>
            {t('edit.quiz.description', {
              defaultValue:
                'Pick a chapter on the left, then create or update the scored training quiz learners will see at the end of that chapter.',
            })}
          </p>
        </div>

        <div className={styles.quizWorkspaceLayout}>
          <aside className={styles.quizSidebar}>
            <div className={styles.quizSidebarHeader}>
              <h3 className={styles.chapterSectionTitle}>
                {t('edit.quiz.chapterListTitle', { defaultValue: 'Chapters' })}
              </h3>
              <p className={styles.sectionDescription}>
                {t('edit.quiz.chapterListDescription', {
                  defaultValue: 'Choose the chapter whose training quiz you want to manage.',
                })}
              </p>
            </div>

            {chapters.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>
                  {t('edit.chapters.emptyTitle', { defaultValue: 'No chapters yet' })}
                </p>
              </div>
            ) : (
              <div className={styles.chapterPickerList}>
                {chapters.map((chapter) => {
                  const chapterTitle = i18n.language === 'fi' ? chapter.titleFi : chapter.titleEn;
                  const chapterQuiz = chapter.trainingQuiz;
                  const selectedChapterQuiz = loadedQuiz?.chapterId === chapter.id ? loadedQuiz : null;

                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      className={`${styles.chapterPickerCard} ${
                        chapter.id === selectedChapterId ? styles.chapterPickerCardActive : ''
                      }`}
                      onClick={() => {
                        setSelectedChapterId(chapter.id);
                        setQuizMessage(null);
                        setQuizError(null);
                      }}
                    >
                      <div className={styles.chapterPickerCardBody}>
                        <p className={styles.chapterOrderLabel}>
                          {t('edit.chapters.orderLabel', { defaultValue: 'Chapter' })}{' '}
                          {chapter.orderIndex}
                        </p>
                        <h4 className={styles.chapterTitle}>{chapterTitle}</h4>
                        <div className={styles.quizChapterMeta}>
                          <span
                            className={`${styles.quizStatusBadge} ${
                              chapterQuiz
                                ? chapterQuiz.isPublished
                                  ? styles.quizStatusBadgePublished
                                  : styles.quizStatusBadgeDraft
                                : styles.quizStatusBadgeEmpty
                            }`}
                          >
                            {chapterQuiz
                              ? chapterQuiz.isPublished
                                ? t('edit.quiz.statusPublished', { defaultValue: 'Published' })
                                : t('edit.quiz.statusDraft', { defaultValue: 'Draft quiz' })
                              : t('edit.quiz.statusEmpty', { defaultValue: 'No quiz yet' })}
                          </span>
                          <span className={styles.quizCountLabel}>
                            {selectedChapterQuiz
                              ? `${selectedChapterQuiz.questions.length} ${t('edit.quiz.questionsShort', {
                                  defaultValue: 'questions',
                                })}`
                              : chapterQuiz
                                ? t('edit.quiz.quizReady', { defaultValue: 'Quiz ready' })
                                : t('edit.quiz.notConfigured', { defaultValue: 'Not configured' })}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <div className={styles.quizEditorColumn}>
            {selectedChapter ? (
              <>
                <div className={styles.cardHeader}>
                  <h3 className={styles.chapterSectionTitle}>
                    {t('edit.quiz.editorTitle', { defaultValue: 'Training quiz editor' })}
                  </h3>
                  <p className={styles.sectionDescription}>
                    {t('edit.quiz.editorDescription', {
                      defaultValue:
                        'Configure the scored quiz for the selected chapter, including the pass percentage and the full question set.',
                    })}
                  </p>
                </div>

                {quizLoading ? (
                  <div className={styles.emptyState}>
                    <p className={styles.emptyDescription}>
                      {t('edit.quiz.loading', { defaultValue: 'Loading training quiz...' })}
                    </p>
                  </div>
                ) : (
                  <div className={styles.quizEditorCard}>
                    <div className={styles.quizHeaderGrid}>
                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>
                          {t('edit.quiz.titleEn', { defaultValue: 'Quiz title (English)' })}
                        </span>
                        <input
                          className={styles.input}
                          value={quizForm.titleEn}
                          onChange={(event) =>
                            setQuizForm((previous) => ({
                              ...previous,
                              titleEn: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>
                          {t('edit.quiz.titleFi', { defaultValue: 'Quiz title (Finnish)' })}
                        </span>
                        <input
                          className={styles.input}
                          value={quizForm.titleFi}
                          onChange={(event) =>
                            setQuizForm((previous) => ({
                              ...previous,
                              titleFi: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>
                          {t('edit.quiz.descriptionEn', {
                            defaultValue: 'Description (English)',
                          })}
                        </span>
                        <textarea
                          className={styles.textarea}
                          value={quizForm.descriptionEn}
                          onChange={(event) =>
                            setQuizForm((previous) => ({
                              ...previous,
                              descriptionEn: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>
                          {t('edit.quiz.descriptionFi', {
                            defaultValue: 'Description (Finnish)',
                          })}
                        </span>
                        <textarea
                          className={styles.textarea}
                          value={quizForm.descriptionFi}
                          onChange={(event) =>
                            setQuizForm((previous) => ({
                              ...previous,
                              descriptionFi: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>

                    <div className={styles.quizSettingsRow}>
                      <label className={styles.fieldGroupCompact}>
                        <span className={styles.fieldLabel}>
                          {t('edit.quiz.passingScore', { defaultValue: 'Passing score (%)' })}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className={styles.input}
                          value={quizForm.passingScore}
                          onChange={(event) =>
                            setQuizForm((previous) => ({
                              ...previous,
                              passingScore: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className={styles.checkboxRow}>
                        <input
                          type="checkbox"
                          checked={quizForm.isPublished}
                          onChange={(event) =>
                            setQuizForm((previous) => ({
                              ...previous,
                              isPublished: event.target.checked,
                            }))
                          }
                        />
                        <span>
                          {t('edit.quiz.publishNow', {
                            defaultValue: 'Make this quiz visible to learners now',
                          })}
                        </span>
                      </label>

                      {loadedQuiz ? (
                        <div className={styles.quizStatsRow}>
                          <span>{loadedQuiz.stats.attemptCount} {t('edit.quiz.attemptsShort', { defaultValue: 'attempts' })}</span>
                          <span>{t('edit.quiz.bestScoreLabel', { defaultValue: 'Best score' })}: {loadedQuiz.stats.bestScore ?? '-'}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className={styles.questionsHeader}>
                      <h4 className={styles.chapterSectionTitle}>
                        {t('edit.quiz.questionsTitle', { defaultValue: 'Questions' })}
                      </h4>
                      <button type="button" className={styles.secondaryAction} onClick={addQuestion}>
                        {t('edit.quiz.addQuestion', { defaultValue: 'Add question' })}
                      </button>
                    </div>

                    <div className={styles.questionList}>
                      {quizForm.questions.map((question, questionIndex) => (
                        <section key={question.id} className={styles.questionCard}>
                          <div className={styles.questionCardHeader}>
                            <div>
                              <p className={styles.chapterOrderLabel}>
                                {t('edit.quiz.questionLabel', { defaultValue: 'Question' })} {questionIndex + 1}
                              </p>
                              <h5 className={styles.subChapterTitle}>
                                {question.promptEn.trim() ||
                                  t('edit.quiz.untitledQuestion', {
                                    defaultValue: 'Untitled question',
                                  })}
                              </h5>
                            </div>
                            <button
                              type="button"
                              className={styles.inlineDanger}
                              disabled={quizForm.questions.length === 1}
                              onClick={() => removeQuestion(question.id)}
                            >
                              {t('courseActions.delete', { defaultValue: 'Delete' })}
                            </button>
                          </div>

                          <div className={styles.questionGrid}>
                            <label className={styles.fieldGroup}>
                              <span className={styles.fieldLabel}>
                                {t('edit.quiz.promptEn', { defaultValue: 'Prompt (English)' })}
                              </span>
                              <input
                                className={styles.input}
                                value={question.promptEn}
                                onChange={(event) =>
                                  updateQuestion(question.id, (current) => ({
                                    ...current,
                                    promptEn: event.target.value,
                                  }))
                                }
                              />
                            </label>

                            <label className={styles.fieldGroup}>
                              <span className={styles.fieldLabel}>
                                {t('edit.quiz.promptFi', { defaultValue: 'Prompt (Finnish)' })}
                              </span>
                              <input
                                className={styles.input}
                                value={question.promptFi}
                                onChange={(event) =>
                                  updateQuestion(question.id, (current) => ({
                                    ...current,
                                    promptFi: event.target.value,
                                  }))
                                }
                              />
                            </label>

                            <label className={styles.fieldGroup}>
                              <span className={styles.fieldLabel}>
                                {t('edit.quiz.explanationEn', { defaultValue: 'Explanation (English)' })}
                              </span>
                              <textarea
                                className={styles.textarea}
                                value={question.explanationEn}
                                onChange={(event) =>
                                  updateQuestion(question.id, (current) => ({
                                    ...current,
                                    explanationEn: event.target.value,
                                  }))
                                }
                              />
                            </label>

                            <label className={styles.fieldGroup}>
                              <span className={styles.fieldLabel}>
                                {t('edit.quiz.explanationFi', { defaultValue: 'Explanation (Finnish)' })}
                              </span>
                              <textarea
                                className={styles.textarea}
                                value={question.explanationFi}
                                onChange={(event) =>
                                  updateQuestion(question.id, (current) => ({
                                    ...current,
                                    explanationFi: event.target.value,
                                  }))
                                }
                              />
                            </label>
                          </div>

                          <label className={styles.fieldGroupCompact}>
                            <span className={styles.fieldLabel}>
                              {t('edit.quiz.questionType', { defaultValue: 'Question type' })}
                            </span>
                            <select
                              className={styles.select}
                              value={question.type}
                              onChange={(event) =>
                                handleQuestionTypeChange(
                                  question.id,
                                  event.target.value as QuizQuestionType,
                                )
                              }
                            >
                              <option value="single_choice">
                                {t('edit.quiz.singleChoice', { defaultValue: 'Single choice' })}
                              </option>
                              <option value="multiple_choice">
                                {t('edit.quiz.multipleChoice', { defaultValue: 'Multiple choice' })}
                              </option>
                            </select>
                          </label>

                          <div className={styles.optionsHeader}>
                            <h6 className={styles.fieldLabel}>
                              {t('edit.quiz.optionsTitle', { defaultValue: 'Answer options' })}
                            </h6>
                            <button
                              type="button"
                              className={styles.inlineAction}
                              onClick={() => addOption(question.id)}
                            >
                              {t('edit.quiz.addOption', { defaultValue: 'Add option' })}
                            </button>
                          </div>

                          <div className={styles.optionsList}>
                            {question.options.map((option, optionIndex) => (
                              <div key={option.id} className={styles.optionRow}>
                                <label className={styles.correctToggle}>
                                  <input
                                    type={question.type === 'single_choice' ? 'radio' : 'checkbox'}
                                    name={`correct-${question.id}`}
                                    checked={option.isCorrect}
                                    onChange={(event) =>
                                      toggleOptionCorrect(question.id, option.id, event.target.checked)
                                    }
                                  />
                                  <span>{t('edit.quiz.correctAnswer', { defaultValue: 'Correct' })}</span>
                                </label>
                                <input
                                  className={styles.input}
                                  placeholder={t('edit.quiz.optionEn', { defaultValue: 'Option (English)' })}
                                  value={option.labelEn}
                                  onChange={(event) =>
                                    updateQuestion(question.id, (current) => ({
                                      ...current,
                                      options: current.options.map((currentOption) =>
                                        currentOption.id === option.id
                                          ? { ...currentOption, labelEn: event.target.value }
                                          : currentOption,
                                      ),
                                    }))
                                  }
                                />
                                <input
                                  className={styles.input}
                                  placeholder={t('edit.quiz.optionFi', { defaultValue: 'Option (Finnish)' })}
                                  value={option.labelFi}
                                  onChange={(event) =>
                                    updateQuestion(question.id, (current) => ({
                                      ...current,
                                      options: current.options.map((currentOption) =>
                                        currentOption.id === option.id
                                          ? { ...currentOption, labelFi: event.target.value }
                                          : currentOption,
                                      ),
                                    }))
                                  }
                                />
                                <button
                                  type="button"
                                  className={styles.inlineDanger}
                                  disabled={question.options.length === 2}
                                  onClick={() => removeOption(question.id, option.id)}
                                >
                                  {optionIndex + 1}
                                </button>
                              </div>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>

                    {quizMessage ? <p className={styles.successMessage}>{quizMessage}</p> : null}
                    {quizError ? <p className={styles.errorMessage}>{quizError}</p> : null}

                    <div className={styles.actions}>
                      <button type="button" className={styles.secondaryAction} onClick={resetCurrentForm}>
                        {t('common.cancel', { defaultValue: 'Cancel' })}
                      </button>
                      {loadedQuiz ? (
                        <button
                          type="button"
                          className={styles.inlineDanger}
                          disabled={isDeletingQuiz}
                          onClick={() => void handleDeleteQuiz()}
                        >
                          {isDeletingQuiz
                            ? t('edit.quiz.deleting', { defaultValue: 'Deleting quiz...' })
                            : t('edit.quiz.deleteQuiz', { defaultValue: 'Delete quiz' })}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={styles.primaryAction}
                        disabled={isSavingQuiz}
                        onClick={() => void handleSaveQuiz()}
                      >
                        {isSavingQuiz
                          ? t('edit.quiz.saving', { defaultValue: 'Saving quiz...' })
                          : t('edit.quiz.saveQuiz', { defaultValue: 'Save quiz' })}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>
                  {t('edit.quiz.selectChapterTitle', { defaultValue: 'Select a chapter first' })}
                </p>
                <p className={styles.emptyDescription}>
                  {t('edit.quiz.selectChapterDescription', {
                    defaultValue: 'Choose a chapter from the left sidebar to manage its training quiz.',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </EditCourseShell>
  );
}
