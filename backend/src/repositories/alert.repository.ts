import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { alerts, contracts } from '@/db/schema';
import type {
  AlertPriorityEnum,
  AlertWithContract,
  GetAlertsQuery,
} from '@/types/alert.type';

export const getAlerts = async (query: GetAlertsQuery) => {
  const { page, limit, priority, isRead, contractId } = query;
  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [];

  if (priority) {
    whereConditions.push(eq(alerts.priority, priority));
  }

  if (typeof isRead === 'boolean') {
    whereConditions.push(eq(alerts.isRead, isRead));
  }

  if (contractId) {
    whereConditions.push(eq(alerts.contractId, contractId));
  }

  // Get alerts with contract details
  const alertsList = await db
    .select({
      id: alerts.id,
      contractId: alerts.contractId,
      message: alerts.message,
      priority: alerts.priority,
      isRead: alerts.isRead,
      createdBy: alerts.createdBy,
      createdAt: alerts.createdAt,
      contract: {
        id: contracts.id,
        title: contracts.title,
        status: contracts.status,
      },
    })
    .from(alerts)
    .leftJoin(contracts, eq(alerts.contractId, contracts.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .limit(limit)
    .offset(offset)
    .orderBy(alerts.createdAt);

  // Get total count for pagination
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(alerts)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const totalPages = Math.ceil(count / limit);

  // Transform dates to ISO strings and structure the data
  const transformedAlerts: AlertWithContract[] = alertsList.map((alert) => ({
    id: alert.id,
    contractId: alert.contractId,
    message: alert.message,
    priority: alert.priority as AlertPriorityEnum,
    isRead: alert.isRead,
    createdBy: alert.createdBy,
    createdAt: alert.createdAt.toISOString(),
    contract: alert.contract || undefined,
  }));

  return {
    alerts: transformedAlerts,
    pagination: {
      page,
      limit,
      total: count,
      totalPages,
    },
  };
};

export const getAlertById = async (
  id: number,
): Promise<AlertWithContract | null> => {
  const alertResult = await db
    .select({
      id: alerts.id,
      contractId: alerts.contractId,
      message: alerts.message,
      priority: alerts.priority,
      isRead: alerts.isRead,
      createdBy: alerts.createdBy,
      createdAt: alerts.createdAt,
      contract: {
        id: contracts.id,
        title: contracts.title,
        status: contracts.status,
      },
    })
    .from(alerts)
    .leftJoin(contracts, eq(alerts.contractId, contracts.id))
    .where(eq(alerts.id, id))
    .limit(1);

  if (alertResult.length === 0) {
    return null;
  }

  const alert = alertResult[0];
  return {
    id: alert.id,
    contractId: alert.contractId,
    message: alert.message,
    priority: alert.priority as AlertPriorityEnum,
    isRead: alert.isRead,
    createdBy: alert.createdBy,
    createdAt: alert.createdAt.toISOString(),
    contract: alert.contract || undefined,
  };
};

export const markAlertAsRead = async (
  id: number,
  isRead: boolean,
): Promise<AlertWithContract | null> => {
  const [updatedAlert] = await db
    .update(alerts)
    .set({ isRead })
    .where(eq(alerts.id, id))
    .returning();

  if (!updatedAlert) {
    return null;
  }

  // Get the alert with contract details
  return await getAlertById(id);
};

export const getUnreadAlertsCount = async (): Promise<number> => {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(alerts)
    .where(eq(alerts.isRead, false));

  return count;
};
