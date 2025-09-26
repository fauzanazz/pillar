import {
  createAlert as createAlertRepo,
  getAlertById as getAlertByIdRepo,
  getAlerts as getAlertsRepo,
  getUnreadAlertsCount as getUnreadAlertsCountRepo,
  markAlertAsRead as markAlertAsReadRepo,
} from '@/repositories/alert.repository';
import type {
  CreateAlert,
  GetAlertsQuery,
  MarkAlertAsRead,
} from '@/types/alert.type';

export const getAlertsService = async (query: GetAlertsQuery) => {
  return await getAlertsRepo(query);
};

export const getAlertByIdService = async (id: number) => {
  return await getAlertByIdRepo(id);
};

export const markAlertAsReadService = async (
  id: number,
  data: MarkAlertAsRead,
) => {
  return await markAlertAsReadRepo(id, data.isRead);
};

export const getUnreadAlertsCountService = async () => {
  return await getUnreadAlertsCountRepo();
};

export const createAlertService = async (
  alertData: CreateAlert,
  createdBy: string,
) => {
  return await createAlertRepo(alertData, createdBy);
};
