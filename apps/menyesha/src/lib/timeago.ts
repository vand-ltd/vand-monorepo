import { format, register } from 'timeago.js';

// Register Kinyarwanda locale
register('rw', (_number, index) => {
  return ([
    ['ubu nyine', 'ubu nyine'],
    ['hashize amasegonda %s', 'mu masegonda %s'],
    ['hashize umunota 1', 'mu munota 1'],
    ['hashize iminota %s', 'mu minota %s'],
    ['hashize isaha 1', 'mu isaha 1'],
    ['hashize amasaha %s', 'mu masaha %s'],
    ['hashize umunsi 1', 'mu munsi 1'],
    ['hashize iminsi %s', 'mu minsi %s'],
    ['hashize icyumweru 1', 'mu cyumweru 1'],
    ['hashize ibyumweru %s', 'mu byumweru %s'],
    ['hashize ukwezi 1', 'mu kwezi 1'],
    ['hashize amezi %s', 'mu mezi %s'],
    ['hashize umwaka 1', 'mu mwaka 1'],
    ['hashize imyaka %s', 'mu myaka %s'],
  ] as [string, string][])[index];
});

export function formatTimeAgo(dateString: string, locale: string = 'en'): string {
  return format(dateString, locale);
}
