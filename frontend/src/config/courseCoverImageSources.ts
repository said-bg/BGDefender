type LocalImagePattern = {
  pathname: string;
};

type RemoteImagePattern = {
  protocol: 'http' | 'https';
  hostname: string;
  port?: string;
  pathname?: string;
};

export const courseCoverLocalImagePatterns: LocalImagePattern[] = [
  {
    pathname: '/assets/images/**',
  },
];

export const courseCoverRemoteImagePatterns: RemoteImagePattern[] = [
  {
    protocol: 'https',
    hostname: 'bis-dev.com',
  },
  {
    protocol: 'https',
    hostname: 'picsum.photos',
  },
  {
    protocol: 'https',
    hostname: 'media.licdn.com',
  },
  {
    protocol: 'https',
    hostname: 'img-c.udemycdn.com',
  },
  {
    protocol: 'https',
    hostname: 'encrypted-tbn0.gstatic.com',
  },
  {
    protocol: 'https',
    hostname: 'cdn.educba.com',
  },
  {
    protocol: 'https',
    hostname: 'wisdomplexus.com',
  },
];

function isPrivateHostname(hostname: string) {
  const normalizedHostname = hostname.toLowerCase();

  return (
    normalizedHostname === 'localhost' ||
    normalizedHostname === '127.0.0.1' ||
    normalizedHostname === '::1' ||
    normalizedHostname.startsWith('10.') ||
    normalizedHostname.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalizedHostname)
  );
}

function matchesPathname(pathname: string, pattern?: string) {
  if (!pattern) {
    return true;
  }

  if (pattern.endsWith('/**')) {
    return pathname.startsWith(pattern.slice(0, -2));
  }

  return pathname === pattern;
}

export function isNextManagedCourseCoverSource(src: string) {
  if (src.startsWith('/')) {
    return courseCoverLocalImagePatterns.some((pattern) =>
      matchesPathname(src, pattern.pathname),
    );
  }

  try {
    const url = new URL(src);

    if (isPrivateHostname(url.hostname)) {
      return false;
    }

    return courseCoverRemoteImagePatterns.some((pattern) => {
      if (url.protocol !== `${pattern.protocol}:`) {
        return false;
      }

      if (url.hostname !== pattern.hostname) {
        return false;
      }

      if (pattern.port && url.port !== pattern.port) {
        return false;
      }

      return matchesPathname(url.pathname, pattern.pathname);
    });
  } catch {
    return false;
  }
}
