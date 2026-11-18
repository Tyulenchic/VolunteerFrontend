export interface DeviceInfo { browser: string; os: string; mobile: boolean }

/** Браузер и система из User-Agent. Порядок проверок важен: Edge и Opera тоже называют себя Chrome, Chrome — Safari. */
export function describeDevice(userAgent: string | null | undefined): DeviceInfo {
  const ua = userAgent ?? '';
  if (!ua) return { browser: 'Неизвестный браузер', os: 'неизвестной системе', mobile: false };

  const browser =
    /Edg(e|A|iOS)?\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /YaBrowser\//.test(ua) ? 'Яндекс Браузер'
    : /Firefox\/|FxiOS\//.test(ua) ? 'Firefox'
    : /Chrome\/|CriOS\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : 'Неизвестный браузер';

  const os =
    /Windows/.test(ua) ? 'Windows'
    : /Android/.test(ua) ? 'Android'
    : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
    : /CrOS/.test(ua) ? 'ChromeOS'
    : /Linux|X11/.test(ua) ? 'Linux'
    : 'неизвестной системе';

  return { browser, os, mobile: /Mobile|Android|iPhone|iPad|iPod/.test(ua) };
}

export const deviceTitle = (userAgent: string | null | undefined): string => {
  const { browser, os } = describeDevice(userAgent);
  return `${browser} на ${os}`;
};
