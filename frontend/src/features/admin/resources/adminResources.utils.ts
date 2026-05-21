type ResourceUserLike = {
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export const getAdminResourceUserLabel = (user: ResourceUserLike): string => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.email;
};

export const getAdminResourceGroupLabel = (group: {
  title: string;
  memberCount: number;
}): string => `${group.title} (${group.memberCount})`;
