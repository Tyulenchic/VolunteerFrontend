import { describe, expect, it } from 'vitest';
import { describeDevice, deviceTitle } from './device';

describe('describeDevice', () => {
  it('recognises the common desktop browsers', () => {
    expect(deviceTitle('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36')).toBe('Chrome на Windows');
    expect(deviceTitle('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0')).toBe('Edge на Windows');
    expect(deviceTitle('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36 OPR/115.0')).toBe('Opera на Windows');
    expect(deviceTitle('Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0')).toBe('Firefox на Linux');
    expect(deviceTitle('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15')).toBe('Safari на macOS');
  });

  it('tells phones from computers', () => {
    const iphone = describeDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1');
    expect(iphone).toEqual({ browser: 'Safari', os: 'iOS', mobile: true });
    const android = describeDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36');
    expect(android).toEqual({ browser: 'Chrome', os: 'Android', mobile: true });
    expect(describeDevice('Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36').mobile).toBe(false);
  });

  it('does not fail on a missing or unknown agent', () => {
    expect(deviceTitle(null)).toBe('Неизвестный браузер на неизвестной системе');
    expect(describeDevice('curl/8.0')).toEqual({ browser: 'Неизвестный браузер', os: 'неизвестной системе', mobile: false });
  });
});
