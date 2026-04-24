const getNavbarOffset = () => {
  if (typeof document === 'undefined') {
    return 0;
  }

  const navbar = document.querySelector<HTMLElement>('nav[aria-label="Primary"]');
  return (navbar?.getBoundingClientRect().height ?? 0) + 16;
};

const scrollWindowTo = (top: number, behavior: ScrollBehavior) => {
  window.scrollTo({
    top: Math.max(0, top),
    left: 0,
    behavior,
  });
};

export const scrollToCourseHero = (behavior: ScrollBehavior = 'auto') => {
  if (typeof window === 'undefined') {
    return;
  }

  scrollWindowTo(0, behavior);
};

export const scrollToCourseContentHeader = (behavior: ScrollBehavior = 'smooth') => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const contentHeader = document.querySelector<HTMLElement>('[data-course-content-header]');

  if (!contentHeader) {
    scrollToCourseHero(behavior);
    return;
  }

  const top =
    window.scrollY + contentHeader.getBoundingClientRect().top - getNavbarOffset();

  scrollWindowTo(top, behavior);
};
