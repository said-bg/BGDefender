export type CreateCourseFormState = {
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  level: 'free' | 'premium';
  status: 'draft' | 'published';
  estimatedDuration: string;
  coverImage: string;
  authorIds: string[];
  programDirectorId: string;
};

export const initialCreateCourseFormState: CreateCourseFormState = {
  titleEn: '',
  titleFi: '',
  descriptionEn: '',
  descriptionFi: '',
  level: 'free',
  status: 'draft',
  estimatedDuration: '',
  coverImage: '',
  authorIds: [],
  programDirectorId: '',
};

export type ImageMode = 'url' | 'upload';

export type SetCreateCourseField = <K extends keyof CreateCourseFormState>(
  field: K,
  value: CreateCourseFormState[K],
) => void;
