export interface AiDependencyEvidence {
  dependency_id: string;
  dependency_name?: string;
  error_rate: number;
  latency_ms: number;
  health_status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  traffic_share: number;
}

export interface PredictionCandidate {
  type: 'anomaly' | 'dependency' | 'metric';
  confidence: number;
  summary: string;
  evidenceId: string;
  metricName?: string;
  supportingEvidence?: string;
  dependencyId?: string;
  dependencyName?: string;
}

export interface OperationalFeatures {
  error_rate: number;
  latency_ms: number;
  cpu_pct: number;
  memory_pct: number;
  anomaly_score: number;
  dependency_risk: number;
  log_error_count: number;
}

export interface PredictDebug {
  features: OperationalFeatures;
  dependencyEvidence?: AiDependencyEvidence[];
  selectedModel: string;
  inferenceMs?: number;
  requestPayload: {
    service_id: string;
    service_name: string;
    symptom: string;
    signals: string[];
    features: OperationalFeatures;
    top_k: number;
  };
}

export interface PredictResult {
  id?: string;
  service: {
    id: string;
    name: string;
    status: string;
  };
  symptom: string;
  signals: string[];
  predictions: PredictionCandidate[];
  model: {
    name: string;
    mode: string;
  };
  isAnomaly?: boolean;
  anomalyScore?: number;
  features?: OperationalFeatures;
  signalCounts?: {
    anomalies: number;
    metrics: number;
    dependencies: number;
    errorLogs?: number;
  };
  dependencyEvidence?: AiDependencyEvidence[];
  debug?: PredictDebug;
  generatedAt: string;
}

/** Payload sent to FastAPI Isolation Forest service */
export interface AiPredictRequestPayload {
  service_id: string;
  service_name: string;
  symptom: string;
  signals: string[];
  features: OperationalFeatures;
  context: Record<string, unknown> & {
    dependencies?: AiDependencyEvidence[];
  };
  top_k: number;
}

export interface AiPredictResponsePayload {
  service_id: string;
  symptom: string;
  is_anomaly: boolean;
  anomaly_score: number;
  predictions: Array<{
    type: 'anomaly' | 'dependency' | 'metric';
    confidence: number;
    summary: string;
    evidence_id?: string | null;
    metric_name?: string | null;
    supporting_evidence?: string | null;
    dependency_id?: string | null;
    dependency_name?: string | null;
  }>;
  model: {
    name: string;
    mode: string;
    framework?: string;
  };
  generated_at: string;
  inference_ms?: number;
}
