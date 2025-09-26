import amqp from 'amqplib';

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
    retryDelay: number = 1000,
  ): Promise<void> {
    // If already connected, return immediately
    if (this.connection && this.channel) {
      console.log('RabbitMQ already connected, skipping connect');
      return;
    }

    // If already connecting, wait for the connection to complete with timeout
    if (this.isConnecting) {
      console.log('RabbitMQ connection already in progress, waiting...');
      let waitTime = 0;
      const maxWaitTime = 30000; // 30 seconds timeout
      while (this.isConnecting && waitTime < maxWaitTime) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        waitTime += 100;
      }

      if (waitTime >= maxWaitTime) {
        console.error('Timeout waiting for existing connection attempt');
        this.isConnecting = false; // Reset the flag
        throw new Error('Connection timeout');
      }

      // Check if connection was successful after waiting
      if (this.connection && this.channel) {
        console.log('RabbitMQ connection completed while waiting');
        return;
      }
    }

    console.log('Starting new RabbitMQ connection attempt');
    this.isConnecting = true;

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        console.log(
          `Connecting to RabbitMQ... (attempt ${attempt + 1}/${maxRetries}) - URL: ${this.url}`,
        );
        this.connection = await amqp.connect(this.url);
        this.channel = await this.connection.createChannel();

        // Handle connection events
        this.connection.on('error', (error) => {
          console.error('RabbitMQ connection error:', error);
          this.connection = null;
          this.channel = null;
          this.isConnecting = false;
        });

        this.connection.on('close', () => {
          console.warn('RabbitMQ connection closed');
          this.connection = null;
          this.channel = null;
          this.isConnecting = false;
        });

        this.isConnecting = false;
        console.log('Connected to RabbitMQ successfully');
        return;
      } catch (error) {
        attempt++;
        console.warn(
          `Failed to connect to RabbitMQ (attempt ${attempt}/${maxRetries}):`,
          error,
        );

        if (attempt >= maxRetries) {
          this.isConnecting = false;
          console.error('Max RabbitMQ connection attempts reached');
          throw error;
        }

        // Exponential backoff with jitter
        const delay =
          retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(
          `Retrying RabbitMQ connection in ${Math.round(delay)}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // If we reach here, all retries failed
    this.isConnecting = false;
    throw new Error(
      `Failed to connect to RabbitMQ after ${maxRetries} attempts`,
    );
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
      console.log('RabbitMQ connection closed');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
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
