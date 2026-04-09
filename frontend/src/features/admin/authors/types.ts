export type AuthorFormState = {
  name: string;
  roleEn: string;
  roleFi: string;
  biographyEn: string;
  biographyFi: string;
  photo: string;
};

export const initialAuthorFormState: AuthorFormState = {
  name: '',
  roleEn: '',
  roleFi: '',
  biographyEn: '',
  biographyFi: '',
  photo: '',
};

export type PhotoMode = 'url' | 'upload';
