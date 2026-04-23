import { Dispatch, SetStateAction } from 'react';
import { Chapter } from '@/services/course';
import formStyles from '@/features/admin/courses/edit-course/shared/EditCourseForm.module.css';
import sharedStyles from '@/features/admin/courses/edit-course/shared/EditCoursePage.module.css';
import { buildDefaultSubChapterFormState } from '../../lib/structure.helpers';
import { SubChapterFormState, TranslationFn } from '../../types';

type SubChapterParentFieldProps = {
  availableParentChapter: Chapter | null;
  chapters: Chapter[];
  editingSubChapterId: string | null;
  language: string;
  onChange: Dispatch<SetStateAction<SubChapterFormState>>;
  subChapterForm: SubChapterFormState;
  t: TranslationFn;
};

const buildNextOrderIndex = (
  nextChapter: Chapter | undefined,
  previous: SubChapterFormState,
  editingSubChapterId: string | null,
  nextChapterId: string,
) =>
  editingSubChapterId && previous.chapterId === nextChapterId
    ? previous.orderIndex
    : buildDefaultSubChapterFormState(nextChapter ?? null).orderIndex;

export default function SubChapterParentField({
  availableParentChapter,
  chapters,
  editingSubChapterId,
  language,
  onChange,
  subChapterForm,
  t,
}: SubChapterParentFieldProps) {
  return (
    <label className={formStyles.fieldWide}>
      <span>{t('edit.subchapters.parentChapter', { defaultValue: 'Parent chapter' })}</span>
      <select
        value={subChapterForm.chapterId}
        onChange={(event) => {
          const nextChapterId = event.target.value;
          const nextChapter = chapters.find((chapter) => chapter.id === nextChapterId);
          onChange((previous) => ({
            ...previous,
            chapterId: nextChapterId,
            orderIndex: buildNextOrderIndex(
              nextChapter,
              previous,
              editingSubChapterId,
              nextChapterId,
            ),
          }));
        }}
      >
        {chapters.map((chapter) => (
          <option key={chapter.id} value={chapter.id}>
            {language === 'fi' ? chapter.titleFi : chapter.titleEn}
          </option>
        ))}
      </select>
      {availableParentChapter ? (
        <p className={sharedStyles.helperText}>
          {t('edit.subchapters.parentHint', {
            defaultValue: 'This subchapter will be saved inside',
          })}{' '}
          <strong>
            {language === 'fi'
              ? availableParentChapter.titleFi
              : availableParentChapter.titleEn}
          </strong>
        </p>
      ) : null}
    </label>
  );
}
