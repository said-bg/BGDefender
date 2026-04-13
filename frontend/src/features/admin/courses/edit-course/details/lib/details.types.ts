export type EditCourseFormState = {
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  level: 'free' | 'premium';
  status: 'draft' | 'published';
  estimatedDuration: string;
  coverImage: string;
  authorIds: string[];
};

export type CoverImageMode = 'url' | 'upload';

export const initialFormState: EditCourseFormState = {
  titleEn: '',
  titleFi: '',
  descriptionEn: '',
  descriptionFi: '',
  level: 'free',
  status: 'draft',
  estimatedDuration: '',
  coverImage: '',
  authorIds: [],
};
