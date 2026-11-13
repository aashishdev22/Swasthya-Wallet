/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Legacy type re-export shim. All production code imports domain types from
 * `src/types/health.ts` and loads real citizen data from Supabase / IndexedDB.
 */

export type {
  PatientProfile,
  BiomarkerItem,
  MedicalRecord,
  VaccineItem,
  ActiveDelegation,
  AuditEvent,
  AppointmentItem,
  NotificationItem,
  UserMedicine,
  NotificationPreferences,
  DashboardSummary,
} from '../types/health.ts';
