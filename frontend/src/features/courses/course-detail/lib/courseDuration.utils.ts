export const formatCourseDuration = (durationInMinutes?: number | null) => {
  if (!durationInMinutes || durationInMinutes <= 0 || !Number.isFinite(durationInMinutes)) {
    return null;
  }

  const totalMinutes = Math.round(durationInMinutes);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes} min`;
};
