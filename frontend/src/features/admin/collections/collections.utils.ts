export const getNextCollectionOrderIndex = (
  collections: Array<{ orderIndex: number }> = [],
) => String(collections.length + 1);

export const sortCollectionsByOrderIndex = <T extends { orderIndex: number }>(
  collections: T[],
) => [...collections].sort((left, right) => left.orderIndex - right.orderIndex);

export const toggleCollectionCourse = (
  courseIds: string[],
  courseId: string,
): string[] => {
  return courseIds.includes(courseId)
    ? courseIds.filter((id) => id !== courseId)
    : [...courseIds, courseId];
};

export const moveCollectionCourse = (
  courseIds: string[],
  courseId: string,
  direction: 'up' | 'down',
): string[] => {
  const currentIndex = courseIds.indexOf(courseId);

  if (currentIndex === -1) {
    return courseIds;
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= courseIds.length) {
    return courseIds;
  }

  const nextCourseIds = [...courseIds];
  const [item] = nextCourseIds.splice(currentIndex, 1);
  nextCourseIds.splice(targetIndex, 0, item);

  return nextCourseIds;
};
