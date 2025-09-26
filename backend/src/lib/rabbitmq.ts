import type amqp from 'amqplib';

import {
  EXCHANGES,
  type ExchangeName,
  QUEUES,
  type QueueName,
  ROUTING_KEYS,
  rabbitmqConfig,
} from '@/configs/rabbitmq.config';

export type MessagePayload = Record<string, unknown>;

export interface MessageOptions {
  persistent?: boolean;
  priority?: number;
  expiration?: string;
  messageId?: string;
  correlationId?: string;
  timestamp?: number;
  type?: string;
  userId?: string;
  appId?: string;
  deliveryMode?: number;
  headers?: Record<string, unknown>;
}

export class RabbitMQService {
  private static instance: RabbitMQService;

  static getInstance(): RabbitMQService {
    if (!RabbitMQService.instance) {
      RabbitMQService.instance = new RabbitMQService();
    }
    return RabbitMQService.instance;
  }

  /**
   * Initialize exchanges and queues according to PRD specs
   */
  async initialize(): Promise<void> {
    const channel = await rabbitmqConfig.getChannel();

    // Create exchanges (topic-based for routing)
    await channel.assertExchange(EXCHANGES.CONTRACTS, 'topic', {
      durable: true,
    });
    await channel.assertExchange(EXCHANGES.SCHEDULER, 'topic', {
      durable: true,
    });
    await channel.assertExchange(EXCHANGES.ALERTS, 'topic', {
      durable: true,
    });
    await channel.assertExchange(EXCHANGES.DEAD, 'topic', {
      durable: true,
    });

    // Create main queues with DLQ configuration
    const queueOptions = {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': EXCHANGES.DEAD,
      },
    };

    await Promise.all([
      // Main processing queues
      channel.assertQueue(QUEUES.CONTRACTS_OBJECT_UPLOADED, {
        ...queueOptions,
        arguments: {
          ...queueOptions.arguments,
          'x-dead-letter-routing-key': 'contracts.object_uploaded.q.dead',
        },
      }),
      channel.assertQueue(QUEUES.CONTRACTS_BATCH_INGEST, {
        ...queueOptions,
        arguments: {
          ...queueOptions.arguments,
          'x-dead-letter-routing-key': 'contracts.batch_ingest.q.dead',
        },
      }),
      channel.assertQueue(QUEUES.CONTRACTS_DAILY_CHECK, {
        ...queueOptions,
        arguments: {
          ...queueOptions.arguments,
          'x-dead-letter-routing-key': 'contracts.daily_check.q.dead',
        },
      }),
      channel.assertQueue(QUEUES.ALERTS_EVENTS, {
        ...queueOptions,
        arguments: {
          ...queueOptions.arguments,
          'x-dead-letter-routing-key': 'alerts.events.q.dead',
        },
      }),
      // Dead letter queues
      channel.assertQueue(QUEUES.CONTRACTS_OBJECT_UPLOADED_DLQ, {
        durable: true,
      }),
      channel.assertQueue(QUEUES.CONTRACTS_BATCH_INGEST_DLQ, {
        durable: true,
      }),
      channel.assertQueue(QUEUES.CONTRACTS_DAILY_CHECK_DLQ, {
        durable: true,
      }),
      channel.assertQueue(QUEUES.ALERTS_EVENTS_DLQ, {
        durable: true,
      }),
    ]);

    // Bind main queues to exchanges with routing keys
    await Promise.all([
      // Contract upload events
      channel.bindQueue(
        QUEUES.CONTRACTS_OBJECT_UPLOADED,
        EXCHANGES.CONTRACTS,
        ROUTING_KEYS.OBJECT_UPLOADED_PDF,
      ),
      // Batch ingest events
      channel.bindQueue(
        QUEUES.CONTRACTS_BATCH_INGEST,
        EXCHANGES.CONTRACTS,
        ROUTING_KEYS.OBJECT_UPLOADED_BATCH,
      ),
      // Daily check events
      channel.bindQueue(
        QUEUES.CONTRACTS_DAILY_CHECK,
        EXCHANGES.SCHEDULER,
        ROUTING_KEYS.CONTRACT_DAILY_CHECK,
      ),
      // Alert events - bind to multiple routing keys
      channel.bindQueue(
        QUEUES.ALERTS_EVENTS,
        EXCHANGES.ALERTS,
        ROUTING_KEYS.ALERTS_CONTRACT_EXPIRING,
      ),
      channel.bindQueue(
        QUEUES.ALERTS_EVENTS,
        EXCHANGES.ALERTS,
        ROUTING_KEYS.ALERTS_CONTRACT_CLAUSE_MISSING,
      ),
      channel.bindQueue(
        QUEUES.ALERTS_EVENTS,
        EXCHANGES.ALERTS,
        ROUTING_KEYS.ALERTS_CONTRACT_ANOMALY,
      ),
      // DLQ bindings to dead exchange
      channel.bindQueue(
        QUEUES.CONTRACTS_OBJECT_UPLOADED_DLQ,
        EXCHANGES.DEAD,
        'contracts.object_uploaded.q.dead',
      ),
      channel.bindQueue(
        QUEUES.CONTRACTS_BATCH_INGEST_DLQ,
        EXCHANGES.DEAD,
        'contracts.batch_ingest.q.dead',
      ),
      channel.bindQueue(
        QUEUES.CONTRACTS_DAILY_CHECK_DLQ,
        EXCHANGES.DEAD,
        'contracts.daily_check.q.dead',
      ),
      channel.bindQueue(
        QUEUES.ALERTS_EVENTS_DLQ,
        EXCHANGES.DEAD,
        'alerts.events.q.dead',
      ),
    ]);

    console.log(
      'RabbitMQ exchanges and queues initialized according to PRD specs',
    );
  }

  /**
   * Publish a message to a queue
   */
  async publishToQueue(
    queueName: QueueName,
    message: MessagePayload,
    options: MessageOptions = {},
  ): Promise<boolean> {
    try {
      const channel = await rabbitmqConfig.getChannel();

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const publishOptions: amqp.Options.Publish = {
        persistent: options.persistent ?? true,
        priority: options.priority,
        expiration: options.expiration,
        messageId: options.messageId,
        timestamp: options.timestamp ?? Date.now(),
        type: options.type,
        userId: options.userId,
        appId: options.appId,
        deliveryMode: options.deliveryMode ?? 2, // persistent
        headers: options.headers,
      };

      return channel.sendToQueue(queueName, messageBuffer, publishOptions);
    } catch (error) {
      console.error(`Failed to publish message to queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Publish a message to an exchange with routing key
   */
  async publishToExchange(
    exchangeName: ExchangeName,
    routingKey: string,
    message: MessagePayload,
    options: MessageOptions = {},
  ): Promise<boolean> {
    try {
      const channel = await rabbitmqConfig.getChannel();

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const publishOptions: amqp.Options.Publish = {
        persistent: options.persistent ?? true,
        priority: options.priority,
        expiration: options.expiration,
        messageId: options.messageId,
        timestamp: options.timestamp ?? Date.now(),
        type: options.type,
        userId: options.userId,
        appId: options.appId,
        deliveryMode: options.deliveryMode ?? 2, // persistent
        headers: options.headers,
      };

      return channel.publish(
        exchangeName,
        routingKey,
        messageBuffer,
        publishOptions,
      );
    } catch (error) {
      console.error(
        `Failed to publish message to exchange ${exchangeName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Consume messages from a queue
   */
  async consumeFromQueue(
    queueName: QueueName,
    callback: (
      message: MessagePayload,
      msg: amqp.ConsumeMessage | null,
    ) => Promise<void>,
    options: amqp.Options.Consume = {},
  ): Promise<void> {
    try {
      const channel = await rabbitmqConfig.getChannel();

      await channel.consume(
        queueName,
        async (msg: amqp.ConsumeMessage | null) => {
          if (msg) {
            try {
              const messageContent = JSON.parse(msg.content.toString());
              await callback(messageContent, msg);
              channel.ack(msg);
            } catch (error) {
              console.error(
                `Error processing message from queue ${queueName}:`,
                error,
              );
              channel.nack(msg, false, false); // Don't requeue failed messages
            }
          }
        },
        {
          noAck: false,
          ...options,
        },
      );

      console.log(`Started consuming from queue: ${queueName}`);
    } catch (error) {
      console.error(`Failed to consume from queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Get queue information
   */
  async getQueueInfo(queueName: QueueName): Promise<amqp.Replies.AssertQueue> {
    const channel = await rabbitmqConfig.getChannel();
    return channel.checkQueue(queueName);
  }

  /**
   * Purge all messages from a queue
   */
  async purgeQueue(queueName: QueueName): Promise<amqp.Replies.PurgeQueue> {
    const channel = await rabbitmqConfig.getChannel();
    return channel.purgeQueue(queueName);
  }

  /**
   * Delete a queue
   */
  async deleteQueue(
    queueName: QueueName,
    options: amqp.Options.DeleteQueue = {},
  ): Promise<amqp.Replies.DeleteQueue> {
    const channel = await rabbitmqConfig.getChannel();
    return channel.deleteQueue(queueName, options);
  }
}

// Export singleton instance
export const rabbitMQService = RabbitMQService.getInstance();

// Re-export constants for convenience
export { EXCHANGES, QUEUES, ROUTING_KEYS } from '@/configs/rabbitmq.config';
