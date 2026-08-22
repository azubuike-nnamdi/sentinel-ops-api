import { AlertSeverity } from '../common/enums';

export const LOG_ERROR_COUNT_THRESHOLD = 10;
export const ALERT_DEDUPE_WINDOW_MS = 15 * 60 * 1000;

export interface ThresholdMatch {
  title: string;
  message: string;
  severity: AlertSeverity;
}

const METRIC_RULES: Array<{
  match: (name: string) => boolean;
  threshold: number;
  title: string;
  unitHint: string;
}> = [
  {
    match: (name) => name.includes('error_rate') || name.includes('error-rate'),
    threshold: 0.05,
    title: 'Elevated error rate',
    unitHint: 'error_rate',
  },
  {
    match: (name) => name.includes('latency'),
    threshold: 400,
    title: 'Elevated latency',
    unitHint: 'latency_ms',
  },
  {
    match: (name) => name.includes('cpu'),
    threshold: 80,
    title: 'High CPU utilization',
    unitHint: 'cpu_pct',
  },
  {
    match: (name) => name.includes('memory'),
    threshold: 85,
    title: 'High memory utilization',
    unitHint: 'memory_pct',
  },
];

export function matchMetricThreshold(
  name: string,
  value: number,
): ThresholdMatch | null {
  const lowered = name.toLowerCase();
  const rule = METRIC_RULES.find((item) => item.match(lowered));
  if (!rule || value < rule.threshold) {
    return null;
  }

  const overRatio = value / rule.threshold;
  return {
    title: rule.title,
    message: `${rule.unitHint}=${value} exceeds healthy threshold ${rule.threshold} (in-app alert, not causal proof)`,
    severity:
      overRatio >= 1.5 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
  };
}

export function logErrorVolumeMatch(count: number): ThresholdMatch | null {
  if (count < LOG_ERROR_COUNT_THRESHOLD) {
    return null;
  }
  return {
    title: 'Spike in error logs',
    message: `log_error_count=${count} exceeds healthy threshold ${LOG_ERROR_COUNT_THRESHOLD} (in-app alert, not causal proof)`,
    severity:
      count >= LOG_ERROR_COUNT_THRESHOLD * 2
        ? AlertSeverity.CRITICAL
        : AlertSeverity.WARNING,
  };
}
