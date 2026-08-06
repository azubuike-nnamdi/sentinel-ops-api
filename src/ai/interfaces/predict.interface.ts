export interface PredictionCandidate {
  type: 'anomaly' | 'dependency' | 'metric';
  confidence: number;
  summary: string;
  evidenceId: string;
  metricName?: string;
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
  signalCounts?: {
    anomalies: number;
    metrics: number;
    dependencies: number;
  };
  generatedAt: string;
}

/** Payload sent to FastAPI Isolation Forest service */
export interface AiPredictRequestPayload {
  service_id: string;
  service_name: string;
  symptom: string;
  signals: string[];
  features: {
    error_rate: number;
    latency_ms: number;
    cpu_pct: number;
    memory_pct: number;
    anomaly_score: number;
    dependency_risk: number;
    log_error_count: number;
  };
  context: Record<string, unknown>;
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
  }>;
  model: {
    name: string;
    mode: string;
    framework?: string;
  };
  generated_at: string;
}
