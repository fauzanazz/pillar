import { v4 } from 'uuid';

export const createId = v4;

export const getNow = () => new Date();

export function first<T>(items: T[]): T | undefined {
  return items[0];
}

export function firstSure<T>(items: T[]): T {
  return items[0];
}
