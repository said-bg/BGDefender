type ResourceUserLike = {
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export const getAdminResourceUserLabel = (user: ResourceUserLike): string => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.email;
};
