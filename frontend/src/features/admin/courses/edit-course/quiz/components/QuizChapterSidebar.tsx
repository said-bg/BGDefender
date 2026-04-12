'use client';

import type { AdminChapterQuiz, Chapter } from '@/services/course';
import type { TFunction } from 'i18next';

type QuizChapterSidebarProps = {
  chapters: Chapter[];
  i18nLanguage: string;
  loadedQuiz: AdminChapterQuiz | null;
  selectedChapterId: string | null;
  styles: Record<string, string>;
  t: TFunction<'admin', undefined>;
  onSelectChapter: (chapterId: string) => void;
};

export default function QuizChapterSidebar({
  chapters,
  i18nLanguage,
  loadedQuiz,
  selectedChapterId,
  styles,
  t,
  onSelectChapter,
}: QuizChapterSidebarProps) {
  return (
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
            const chapterTitle = i18nLanguage === 'fi' ? chapter.titleFi : chapter.titleEn;
            const chapterQuiz = chapter.trainingQuiz;
            const selectedChapterQuiz = loadedQuiz?.chapterId === chapter.id ? loadedQuiz : null;

            return (
              <button
                key={chapter.id}
                type="button"
                className={`${styles.chapterPickerCard} ${
                  chapter.id === selectedChapterId ? styles.chapterPickerCardActive : ''
                }`}
                onClick={() => onSelectChapter(chapter.id)}
              >
                <div className={styles.chapterPickerCardBody}>
                  <p className={styles.chapterOrderLabel}>
                    {t('edit.chapters.orderLabel', { defaultValue: 'Chapter' })} {chapter.orderIndex}
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
  );
}
