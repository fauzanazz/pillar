import { randomUUID } from 'crypto';

import { EXCHANGES, ROUTING_KEYS, rabbitMQService } from '@/lib/rabbitmq';
import type {
  AlertEvent,
  BatchIngestEvent,
  DailyCheckEvent,
  MessageEnvelope,
  ObjectUploadedEvent,
} from '@/types/rabbitmq.type';

/**
 * Utility class for publishing PRD-compliant messages to RabbitMQ
 */
export class RabbitMQPublisher {
  private static createEnvelope<T>(message: T): MessageEnvelope<T> {
    return {
      message,
      metadata: {
        published_at: new Date().toISOString(),
        publisher: 'ifest-backend',
        environment: process.env.NODE_ENV || 'development',
        trace_id: randomUUID(),
      },
    };
  }

  /**
   * Publish PDF upload event for single file processing
   */
  static async publishPDFUpload(
    contractId: string,
    s3Object: {
      bucket: string;
      key: string;
      etag: string;
      size: number;
    },
    correlationId?: string,
  ): Promise<boolean> {
    const event: ObjectUploadedEvent = {
      event_id: randomUUID(),
      event_type: 'object.uploaded',
      occurred_at: new Date().toISOString(),
      aggregate_type: 'contract',
      aggregate_id: contractId,
      object: {
        ...s3Object,
        mime: 'application/pdf',
      },
      correlation_id: correlationId || randomUUID(),
      version: 1,
    };

    const envelope = this.createEnvelope(event);

    return rabbitMQService.publishToExchange(
      EXCHANGES.CONTRACTS,
      ROUTING_KEYS.OBJECT_UPLOADED_PDF,
      envelope,
      {
        persistent: true,
        messageId: event.event_id,
        correlationId: event.correlation_id,
        timestamp: Date.now(),
      },
    );
  }

  /**
   * Publish batch ingest event for multiple files
   */
  static async publishBatchIngest(
    items: Array<{
      contractId: string;
      s3Object: {
        bucket: string;
        key: string;
        etag: string;
        size: number;
      };
    }>,
    correlationId?: string,
  ): Promise<boolean> {
    const batchId = randomUUID();
    const batchCorrelationId = correlationId || randomUUID();

    const uploadEvents: ObjectUploadedEvent[] = items.map((item) => ({
      event_id: randomUUID(),
      event_type: 'object.uploaded',
      occurred_at: new Date().toISOString(),
      aggregate_type: 'contract',
      aggregate_id: item.contractId,
      object: {
        ...item.s3Object,
        mime: 'application/pdf',
      },
      correlation_id: batchCorrelationId,
      version: 1,
    }));

    const batchEvent: BatchIngestEvent = {
      event_id: randomUUID(),
      event_type: 'object.uploaded.batch',
      occurred_at: new Date().toISOString(),
      batch_id: batchId,
      items: uploadEvents,
      correlation_id: batchCorrelationId,
      version: 1,
    };

    const envelope = this.createEnvelope(batchEvent);

    return rabbitMQService.publishToExchange(
      EXCHANGES.CONTRACTS,
      ROUTING_KEYS.OBJECT_UPLOADED_BATCH,
      envelope,
      {
        persistent: true,
        messageId: batchEvent.event_id,
        correlationId: batchEvent.correlation_id,
        timestamp: Date.now(),
      },
    );
  }

  /**
   * Publish daily check event for contract re-evaluation
   */
  static async publishDailyCheck(
    contractId: string,
    correlationId?: string,
  ): Promise<boolean> {
    const event: DailyCheckEvent = {
      event_id: randomUUID(),
      event_type: 'contract.daily.check',
      occurred_at: new Date().toISOString(),
      aggregate_type: 'contract',
      aggregate_id: contractId,
      correlation_id: correlationId || randomUUID(),
      version: 1,
    };

    const envelope = this.createEnvelope(event);

    return rabbitMQService.publishToExchange(
      EXCHANGES.SCHEDULER,
      ROUTING_KEYS.CONTRACT_DAILY_CHECK,
      envelope,
      {
        persistent: true,
        messageId: event.event_id,
        correlationId: event.correlation_id,
        timestamp: Date.now(),
      },
    );
  }

  /**
   * Publish alert event from agent analysis
   */
  static async publishAlert(
    contractId: string,
    alertType:
      | 'contract.expiring'
      | 'contract.clause.missing'
      | 'contract.anomaly',
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    facts: Record<string, unknown>,
    renderedMessage: {
      subject: string;
      body_text: string;
    },
    jobId: string,
    agentVersion: string = '2025.09.0',
  ): Promise<boolean> {
    const event: AlertEvent = {
      alert_id: randomUUID(),
      type: alertType,
      severity,
      aggregate_id: contractId,
      facts,
      rendered: renderedMessage,
      source: {
        job_id: jobId,
        agent_version: agentVersion,
      },
      occurred_at: new Date().toISOString(),
    };

    const envelope = this.createEnvelope(event);

    // Determine routing key based on alert type
    let routingKey: string;
    switch (alertType) {
      case 'contract.expiring':
        routingKey = ROUTING_KEYS.ALERTS_CONTRACT_EXPIRING;
        break;
      case 'contract.clause.missing':
        routingKey = ROUTING_KEYS.ALERTS_CONTRACT_CLAUSE_MISSING;
        break;
      case 'contract.anomaly':
        routingKey = ROUTING_KEYS.ALERTS_CONTRACT_ANOMALY;
        break;
      default:
        throw new Error(`Unknown alert type: ${alertType}`);
    }

    return rabbitMQService.publishToExchange(
      EXCHANGES.ALERTS,
      routingKey,
      envelope,
      {
        persistent: true,
        messageId: event.alert_id,
        timestamp: Date.now(),
        headers: {
          alert_type: alertType,
          severity,
          contract_id: contractId,
        },
      },
    );
  }

  /**
   * Publish multiple daily checks for batch processing
   */
  static async publishBatchDailyChecks(
    contractIds: string[],
    correlationId?: string,
  ): Promise<boolean[]> {
    const batchCorrelationId = correlationId || randomUUID();

    const publishPromises = contractIds.map((contractId) =>
      this.publishDailyCheck(contractId, batchCorrelationId),
    );

    return Promise.all(publishPromises);
  }
}

// Export singleton-like usage
export const rabbitMQPublisher = RabbitMQPublisher;
