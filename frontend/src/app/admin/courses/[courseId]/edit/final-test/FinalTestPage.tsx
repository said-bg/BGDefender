'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import courseService, {
  AdminCourseFinalTest,
  Course,
  QuizQuestionType,
  UpsertCourseFinalTestRequest,
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
import shellStyles from '@/features/admin/courses/edit-course/shared/EditCourseShell.module.css';
import quizStyles from '../quiz/QuizPage.module.css';
import featureStyles from './FinalTestPage.module.css';

const styles = {
  ...formStyles,
  ...sharedStyles,
  ...shellStyles,
  ...quizStyles,
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

type FinalTestFormState = {
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

const createEmptyFinalTestForm = (course: Course | null): FinalTestFormState => ({
  titleEn: course ? `${course.titleEn} final test` : '',
  titleFi: course ? `${course.titleFi} final test` : '',
  descriptionEn: '',
  descriptionFi: '',
  passingScore: '70',
  isPublished: false,
  questions: [createQuestionDraft()],
});

const mapFinalTestToForm = (finalTest: AdminCourseFinalTest): FinalTestFormState => ({
  titleEn: finalTest.titleEn,
  titleFi: finalTest.titleFi,
  descriptionEn: finalTest.descriptionEn ?? '',
  descriptionFi: finalTest.descriptionFi ?? '',
  passingScore: String(finalTest.passingScore),
  isPublished: finalTest.isPublished,
  questions: finalTest.questions.map((question) => ({
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

export default function FinalTestPage() {
  return (
    <EditCourseProtected>
      <FinalTestPageContent />
    </EditCourseProtected>
  );
}

function FinalTestPageContent() {
  const { t, i18n } = useTranslation('admin');
  const courseId = useEditCourseId();
  const [course, setCourse] = useState<Course | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [finalTestLoading, setFinalTestLoading] = useState(false);
  const [finalTestError, setFinalTestError] = useState<string | null>(null);
  const [finalTestMessage, setFinalTestMessage] = useState<string | null>(null);
  const [loadedFinalTest, setLoadedFinalTest] = useState<AdminCourseFinalTest | null>(null);
  const [finalTestForm, setFinalTestForm] = useState<FinalTestFormState>(
    createEmptyFinalTestForm(null),
  );
  const [isSavingFinalTest, setIsSavingFinalTest] = useState(false);
  const [isDeletingFinalTest, setIsDeletingFinalTest] = useState(false);

  useEffect(() => {
    if (!courseId) {
      setLoadError(
        t('edit.missingCourseId', {
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
        setCourse(response);
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

  useEffect(() => {
    if (!courseId || !course) {
      return;
    }

    const loadFinalTest = async () => {
      try {
        setFinalTestLoading(true);
        setFinalTestError(null);
        setFinalTestMessage(null);
        const response = await courseService.getCourseFinalTest(courseId);
        const adminFinalTest = response && 'stats' in response ? response : null;
        setLoadedFinalTest(adminFinalTest);
        setFinalTestForm(
          adminFinalTest
            ? mapFinalTestToForm(adminFinalTest)
            : createEmptyFinalTestForm(course),
        );
      } catch (error) {
        setFinalTestError(
          getApiErrorMessage(
            error,
            t('edit.finalTest.failedToLoad', {
              defaultValue: 'Failed to load the final test.',
            }),
          ),
        );
      } finally {
        setFinalTestLoading(false);
      }
    };

    void loadFinalTest();
  }, [course, courseId, t]);

  const localizedCourseTitle = useMemo(() => {
    if (!course) {
      return '';
    }

    return i18n.language === 'fi' ? course.titleFi : course.titleEn;
  }, [course, i18n.language]);

  const updateQuestion = (
    questionId: string,
    updater: (question: QuizQuestionDraft) => QuizQuestionDraft,
  ) => {
    setFinalTestForm((previous) => ({
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
    setFinalTestForm((previous) => ({
      ...previous,
      questions: [...previous.questions, createQuestionDraft()],
    }));
  };

  const removeQuestion = (questionId: string) => {
    setFinalTestForm((previous) => ({
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
    setFinalTestError(null);
    setFinalTestMessage(null);
    setFinalTestForm(
      loadedFinalTest ? mapFinalTestToForm(loadedFinalTest) : createEmptyFinalTestForm(course),
    );
  };

  const handleSaveFinalTest = async () => {
    if (!courseId) {
      return;
    }

    try {
      setIsSavingFinalTest(true);
      setFinalTestError(null);
      setFinalTestMessage(null);

      const payload: UpsertCourseFinalTestRequest = {
        titleEn: finalTestForm.titleEn.trim(),
        titleFi: finalTestForm.titleFi.trim(),
        descriptionEn: finalTestForm.descriptionEn.trim() || null,
        descriptionFi: finalTestForm.descriptionFi.trim() || null,
        passingScore: Number(finalTestForm.passingScore),
        isPublished: finalTestForm.isPublished,
        questions: finalTestForm.questions.map((question, questionIndex) => ({
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

      const savedFinalTest = await courseService.upsertCourseFinalTest(courseId, payload);
      setLoadedFinalTest(savedFinalTest);
      setFinalTestForm(mapFinalTestToForm(savedFinalTest));
      setFinalTestMessage(
        t('edit.finalTest.saved', {
          defaultValue: 'Final test saved successfully.',
        }),
      );
    } catch (error) {
      setFinalTestError(
        getApiErrorMessage(
          error,
          t('edit.finalTest.saveFailed', {
            defaultValue: 'Failed to save the final test.',
          }),
        ),
      );
    } finally {
      setIsSavingFinalTest(false);
    }
  };

  const handleDeleteFinalTest = async () => {
    if (!courseId || !loadedFinalTest) {
      return;
    }

    const confirmed = window.confirm(
      t('edit.finalTest.deleteConfirm', {
        defaultValue: 'Delete this final test? This action cannot be undone.',
      }),
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingFinalTest(true);
      setFinalTestError(null);
      setFinalTestMessage(null);
      await courseService.deleteCourseFinalTest(courseId);
      setLoadedFinalTest(null);
      setFinalTestForm(createEmptyFinalTestForm(course));
      setFinalTestMessage(
        t('edit.finalTest.deleted', {
          defaultValue: 'Final test deleted successfully.',
        }),
      );
    } catch (error) {
      setFinalTestError(
        getApiErrorMessage(
          error,
          t('edit.finalTest.deleteFailed', {
            defaultValue: 'Failed to delete the final test.',
          }),
        ),
      );
    } finally {
      setIsDeletingFinalTest(false);
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
          t('edit.missingCourseId', {
            defaultValue: 'Missing course id.',
          })
        }
      />
    );
  }

  return (
    <EditCourseShell
      courseId={courseId}
      section="final-test"
      title={t('edit.tabs.finalTest', { defaultValue: 'Final test' })}
      subtitle={t('edit.finalTest.subtitle', {
        defaultValue:
          'Create one optional scored final test for the full course. Learners unlock it only after finishing the course path.',
      })}
      courseTitle={localizedCourseTitle}
      wide
    >
      <section className={styles.formCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.sectionTitle}>
            {t('edit.finalTest.title', { defaultValue: 'Course final test' })}
          </h2>
          <p className={styles.sectionDescription}>
            {t('edit.finalTest.description', {
              defaultValue:
                'Configure the optional final assessment for this course, including its passing percentage and question set.',
            })}
          </p>
        </div>

        <div className={styles.editorLayout}>
          <div className={styles.quizEditorColumn}>
            {finalTestLoading ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyDescription}>
                  {t('edit.finalTest.loading', {
                    defaultValue: 'Loading final test...',
                  })}
                </p>
              </div>
            ) : (
              <div className={styles.quizEditorCard}>
                <div className={styles.quizHeaderGrid}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>
                      {t('edit.finalTest.titleEn', { defaultValue: 'Final test title (English)' })}
                    </span>
                    <input
                      className={styles.input}
                      value={finalTestForm.titleEn}
                      onChange={(event) =>
                        setFinalTestForm((previous) => ({
                          ...previous,
                          titleEn: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>
                      {t('edit.finalTest.titleFi', { defaultValue: 'Final test title (Finnish)' })}
                    </span>
                    <input
                      className={styles.input}
                      value={finalTestForm.titleFi}
                      onChange={(event) =>
                        setFinalTestForm((previous) => ({
                          ...previous,
                          titleFi: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>
                      {t('edit.finalTest.descriptionEn', {
                        defaultValue: 'Description (English)',
                      })}
                    </span>
                    <textarea
                      className={styles.textarea}
                      value={finalTestForm.descriptionEn}
                      onChange={(event) =>
                        setFinalTestForm((previous) => ({
                          ...previous,
                          descriptionEn: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>
                      {t('edit.finalTest.descriptionFi', {
                        defaultValue: 'Description (Finnish)',
                      })}
                    </span>
                    <textarea
                      className={styles.textarea}
                      value={finalTestForm.descriptionFi}
                      onChange={(event) =>
                        setFinalTestForm((previous) => ({
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
                      {t('edit.finalTest.passingScore', {
                        defaultValue: 'Passing score (%)',
                      })}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className={styles.input}
                      value={finalTestForm.passingScore}
                      onChange={(event) =>
                        setFinalTestForm((previous) => ({
                          ...previous,
                          passingScore: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={finalTestForm.isPublished}
                      onChange={(event) =>
                        setFinalTestForm((previous) => ({
                          ...previous,
                          isPublished: event.target.checked,
                        }))
                      }
                    />
                    <span>
                      {t('edit.finalTest.publishNow', {
                        defaultValue: 'Make this final test visible to learners now',
                      })}
                    </span>
                  </label>

                  {loadedFinalTest ? (
                    <div className={styles.quizStatsRow}>
                      <span>
                        {loadedFinalTest.stats.attemptCount}{' '}
                        {t('edit.finalTest.attemptsShort', { defaultValue: 'attempts' })}
                      </span>
                      <span>
                        {t('edit.finalTest.bestScoreLabel', { defaultValue: 'Best score' })}:{' '}
                        {loadedFinalTest.stats.bestScore ?? '-'}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className={styles.questionsHeader}>
                  <h4 className={styles.chapterSectionTitle}>
                    {t('edit.finalTest.questionsTitle', { defaultValue: 'Questions' })}
                  </h4>
                  <button type="button" className={styles.secondaryAction} onClick={addQuestion}>
                    {t('edit.finalTest.addQuestion', { defaultValue: 'Add question' })}
                  </button>
                </div>

                <div className={styles.questionList}>
                  {finalTestForm.questions.map((question, questionIndex) => (
                    <section key={question.id} className={styles.questionCard}>
                      <div className={styles.questionCardHeader}>
                        <div>
                          <p className={styles.chapterOrderLabel}>
                            {t('edit.finalTest.questionLabel', {
                              defaultValue: 'Question',
                            })}{' '}
                            {questionIndex + 1}
                          </p>
                          <h5 className={styles.subChapterTitle}>
                            {question.promptEn.trim() ||
                              t('edit.finalTest.untitledQuestion', {
                                defaultValue: 'Untitled question',
                              })}
                          </h5>
                        </div>
                        <button
                          type="button"
                          className={styles.inlineDanger}
                          disabled={finalTestForm.questions.length === 1}
                          onClick={() => removeQuestion(question.id)}
                        >
                          {t('courseActions.delete', { defaultValue: 'Delete' })}
                        </button>
                      </div>

                      <div className={styles.questionGrid}>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>
                            {t('edit.finalTest.promptEn', { defaultValue: 'Prompt (English)' })}
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
                            {t('edit.finalTest.promptFi', { defaultValue: 'Prompt (Finnish)' })}
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
                            {t('edit.finalTest.explanationEn', {
                              defaultValue: 'Explanation (English)',
                            })}
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
                            {t('edit.finalTest.explanationFi', {
                              defaultValue: 'Explanation (Finnish)',
                            })}
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
                          {t('edit.finalTest.questionType', {
                            defaultValue: 'Question type',
                          })}
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
                            {t('edit.finalTest.singleChoice', {
                              defaultValue: 'Single choice',
                            })}
                          </option>
                          <option value="multiple_choice">
                            {t('edit.finalTest.multipleChoice', {
                              defaultValue: 'Multiple choice',
                            })}
                          </option>
                        </select>
                      </label>

                      <div className={styles.optionsHeader}>
                        <h6 className={styles.fieldLabel}>
                          {t('edit.finalTest.optionsTitle', {
                            defaultValue: 'Answer options',
                          })}
                        </h6>
                        <button
                          type="button"
                          className={styles.inlineAction}
                          onClick={() => addOption(question.id)}
                        >
                          {t('edit.finalTest.addOption', { defaultValue: 'Add option' })}
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
                              <span>
                                {t('edit.finalTest.correctAnswer', { defaultValue: 'Correct' })}
                              </span>
                            </label>
                            <input
                              className={styles.input}
                              placeholder={t('edit.finalTest.optionEn', {
                                defaultValue: 'Option (English)',
                              })}
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
                              placeholder={t('edit.finalTest.optionFi', {
                                defaultValue: 'Option (Finnish)',
                              })}
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

                {finalTestMessage ? <p className={styles.successMessage}>{finalTestMessage}</p> : null}
                {finalTestError ? <p className={styles.errorMessage}>{finalTestError}</p> : null}

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={resetCurrentForm}
                  >
                    {t('common.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  {loadedFinalTest ? (
                    <button
                      type="button"
                      className={styles.inlineDanger}
                      disabled={isDeletingFinalTest}
                      onClick={() => void handleDeleteFinalTest()}
                    >
                      {isDeletingFinalTest
                        ? t('edit.finalTest.deleting', {
                            defaultValue: 'Deleting final test...',
                          })
                        : t('edit.finalTest.deleteTest', {
                            defaultValue: 'Delete final test',
                          })}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={styles.primaryAction}
                    disabled={isSavingFinalTest}
                    onClick={() => void handleSaveFinalTest()}
                  >
                    {isSavingFinalTest
                      ? t('edit.finalTest.saving', { defaultValue: 'Saving final test...' })
                      : t('edit.finalTest.saveTest', { defaultValue: 'Save final test' })}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </EditCourseShell>
  );
}
