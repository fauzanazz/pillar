// Message schemas based on PRD specifications

export interface ObjectUploadedEvent {
  event_id: string;
  event_type: 'object.uploaded';
  occurred_at: string; // ISO 8601 timestamp
  aggregate_type: 'contract';
  aggregate_id: string; // contract ID
  object: {
    bucket: string;
    key: string; // S3 object key
    etag: string;
    mime: string;
    size: number;
  };
  correlation_id: string;
  version: number;
}

export interface BatchIngestEvent {
  event_id: string;
  event_type: 'object.uploaded.batch';
  occurred_at: string;
  batch_id: string;
  items: ObjectUploadedEvent[];
  correlation_id: string;
  version: number;
}

export interface DailyCheckEvent {
  event_id: string;
  event_type: 'contract.daily.check';
  occurred_at: string;
  aggregate_type: 'contract';
  aggregate_id: string; // contract ID
  correlation_id: string;
  version: number;
}

export interface AlertEvent {
  alert_id: string;
  type: 'contract.expiring' | 'contract.clause.missing' | 'contract.anomaly';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  aggregate_id: string; // contract ID
  facts: Record<string, unknown>; // e.g., { days_left: 30 }
  rendered: {
    subject: string;
    body_text: string;
  };
  source: {
    job_id: string;
    agent_version: string;
  };
  occurred_at: string; // ISO 8601 timestamp
}

// Union type for all message types
export type RabbitMQMessage =
  | ObjectUploadedEvent
  | BatchIngestEvent
  | DailyCheckEvent
  | AlertEvent;

// Message envelope for consistent metadata
export interface MessageEnvelope<T = RabbitMQMessage>
  extends Record<string, unknown> {
  message: T;
  metadata: {
    published_at: string;
    publisher: string;
    environment: string;
    trace_id?: string;
  };
}
