import amqp from 'amqplib';
import { logger } from 'better-auth';

import { env } from './env.config';

export class RabbitMQConfig {
  private static instance: RabbitMQConfig;
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private readonly url: string;
  private isConnecting: boolean = false; // Add connection state flag

  private constructor() {
    this.url = env.RABBITMQ_URL;
  }

  public static getInstance(): RabbitMQConfig {
    if (!RabbitMQConfig.instance) {
      RabbitMQConfig.instance = new RabbitMQConfig();
    }
    return RabbitMQConfig.instance;
  }

  public async connect(
    maxRetries: number = 10,
    retryDelay: number = 2000,
  ): Promise<void> {
    // If already connected, return immediately
    if (this.connection && this.channel) {
      return;
    }

    // If already connecting, wait for the connection to complete
    if (this.isConnecting) {
      while (this.isConnecting) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.isConnecting = true;

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        logger.info(
          `Connecting to RabbitMQ... (attempt ${attempt + 1}/${maxRetries})`,
        );
        this.connection = await amqp.connect(this.url);
        this.channel = await this.connection.createChannel();

        // Handle connection events
        this.connection.on('error', (error) => {
          logger.error('RabbitMQ connection error:', error);
          this.connection = null;
          this.channel = null;
          this.isConnecting = false;
        });

        this.connection.on('close', () => {
          logger.warn('RabbitMQ connection closed');
          this.connection = null;
          this.channel = null;
          this.isConnecting = false;
        });

        this.isConnecting = false;
        logger.info('Connected to RabbitMQ successfully');
        return;
      } catch (error) {
        attempt++;
        logger.warn(
          `Failed to connect to RabbitMQ (attempt ${attempt}/${maxRetries}):`,
          error,
        );

        if (attempt >= maxRetries) {
          this.isConnecting = false;
          logger.error('Max RabbitMQ connection attempts reached');
          throw error;
        }

        // Exponential backoff with jitter
        const delay =
          retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        logger.info(
          `Retrying RabbitMQ connection in ${Math.round(delay)}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  public async getChannel(): Promise<amqp.Channel> {
    if (!this.channel || !this.connection) {
      await this.connect();
    }

    if (!this.channel) {
      throw new Error('Failed to establish RabbitMQ channel');
    }

    return this.channel;
  }

  public async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.isConnecting = false;
      logger.info('RabbitMQ connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection:', error);
    }
  }

  public isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
}

export const rabbitmqConfig = RabbitMQConfig.getInstance();

// Exchange names constants (from PRD)
export const EXCHANGES = {
  CONTRACTS: 'contracts.x',
  SCHEDULER: 'scheduler.x',
  ALERTS: 'alerts.x',
  DEAD: 'dead.x',
} as const;

// Queue names constants (from PRD)
export const QUEUES = {
  CONTRACTS_OBJECT_UPLOADED: 'contracts.object_uploaded.q',
  CONTRACTS_BATCH_INGEST: 'contracts.batch_ingest.q',
  CONTRACTS_DAILY_CHECK: 'contracts.daily_check.q',
  ALERTS_EVENTS: 'alerts.events.q',
  // DLQ for each queue
  CONTRACTS_OBJECT_UPLOADED_DLQ: 'contracts.object_uploaded.q.dlq',
  CONTRACTS_BATCH_INGEST_DLQ: 'contracts.batch_ingest.q.dlq',
  CONTRACTS_DAILY_CHECK_DLQ: 'contracts.daily_check.q.dlq',
  ALERTS_EVENTS_DLQ: 'alerts.events.q.dlq',
} as const;

// Routing keys constants
export const ROUTING_KEYS = {
  OBJECT_UPLOADED_PDF: 'object.uploaded.pdf',
  OBJECT_UPLOADED_BATCH: 'object.uploaded.batch',
  CONTRACT_DAILY_CHECK: 'contract.daily.check',
  ALERTS_CONTRACT_EXPIRING: 'contract.expiring',
  ALERTS_CONTRACT_CLAUSE_MISSING: 'contract.clause.missing',
  ALERTS_CONTRACT_ANOMALY: 'contract.anomaly',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
export type ExchangeName = (typeof EXCHANGES)[keyof typeof EXCHANGES];
export type RoutingKey = (typeof ROUTING_KEYS)[keyof typeof ROUTING_KEYS];
