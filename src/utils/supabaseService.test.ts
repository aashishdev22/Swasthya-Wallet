/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSupabaseUrl } from './supabase.ts';
import {
  computeAgeFromDob,
  computeDashboardSummary,
  createCleanPatientProfile,
  fetchHealthRecords,
  getDatabaseConnectionSummary,
  removeProfilePhotoFromSupabase,
  uploadProfilePhotoToSupabase,
} from './supabaseService.ts';

describe('Supabase Service & Real User State Logic Tests', () => {
  test('normalizeSupabaseUrl strips accidental /rest/v1, /auth/v1, /storage/v1 paths and trailing slashes', () => {
    assert.equal(
      normalizeSupabaseUrl('https://bvaloogjexpcajjkemxc.supabase.co/rest/v1'),
      'https://bvaloogjexpcajjkemxc.supabase.co'
    );
    assert.equal(
      normalizeSupabaseUrl('https://bvaloogjexpcajjkemxc.supabase.co/rest/v1/'),
      'https://bvaloogjexpcajjkemxc.supabase.co'
    );
    assert.equal(
      normalizeSupabaseUrl('https://bvaloogjexpcajjkemxc.supabase.co/auth/v1'),
      'https://bvaloogjexpcajjkemxc.supabase.co'
    );
    assert.equal(
      normalizeSupabaseUrl('https://bvaloogjexpcajjkemxc.supabase.co/'),
      'https://bvaloogjexpcajjkemxc.supabase.co'
    );
  });

  test('createCleanPatientProfile builds clean profile without hardcoded mock users', () => {
    const profile = createCleanPatientProfile({
      id: 'usr-test-1234',
      username: 'kiranpatel',
      name: 'Kiran Patel',
      dob: '10/05/1990',
      email: 'kiran@citizen.in',
      phone: '9876543210',
    });

    assert.equal(profile.name, 'Kiran Patel');
    assert.equal(profile.username, 'kiranpatel');
    assert.equal(profile.synthMrn, 'Not linked');
    assert.equal(profile.avatarUrl, '');
    assert.equal(profile.avatarPath, null);
    assert.equal(profile.clinicalNetwork, 'Not linked');
    assert.equal(profile.primaryAttending, 'Not assigned');
    assert.ok(profile.age >= 30);
  });

  test('computeAgeFromDob handles DD/MM/YYYY, YYYY-MM-DD, and invalid input cleanly', () => {
    assert.equal(computeAgeFromDob(''), 0);
    assert.equal(computeAgeFromDob(null), 0);
    assert.equal(computeAgeFromDob('invalid-date'), 0);
    assert.ok(computeAgeFromDob('15/08/1995') >= 28);
    assert.ok(computeAgeFromDob('1995-08-15') >= 28);
  });

  test('computeDashboardSummary returns zero metrics for new users and accurate live aggregates', () => {
    const emptySummary = computeDashboardSummary({
      records: [],
      vaccines: [],
      delegations: [],
      appointments: [],
      notifications: [],
      medicines: [],
    });
    assert.deepEqual(emptySummary, {
      totalRecordsCount: 0,
      prescriptionsCount: 0,
      vaccinesCount: 0,
      dueVaccinesCount: 0,
      activeSharesCount: 0,
      upcomingAppointmentsCount: 0,
      unreadNotificationsCount: 0,
      activeMedicinesCount: 0,
    });

    const populated = computeDashboardSummary({
      records: [
        {
          id: 'r1',
          title: 'CBC Panel',
          category: 'lab',
          code: '58410-2',
          codeStandard: 'LOINC',
          date: '2026-10-12',
          clinician: 'Dr. Verma',
          hospital: 'City Clinic',
          integrityStatus: 'SHA-256 Valid',
          verified: true,
          sha256: 'ABC',
          fileSize: '120 KB',
          fileFormat: 'PDF',
        },
        {
          id: 'r2',
          title: 'OPD Prescription',
          category: 'prescription',
          code: 'RX-1',
          codeStandard: 'RXNORM',
          date: '2026-10-14',
          clinician: 'Dr. Mehta',
          hospital: 'District Hospital',
          integrityStatus: 'SHA-256 Valid',
          verified: true,
          sha256: 'DEF',
          fileSize: '95 KB',
          fileFormat: 'PDF',
        },
      ],
      vaccines: [
        {
          id: 'v1',
          title: 'Tdap Booster',
          subtitle: 'Booster',
          type: 'due',
          status: 'Due Soon',
          code: 'CVX 115',
        },
      ],
      delegations: [
        {
          id: 'd1',
          recipientName: 'Dr. Verma',
          facility: 'City Clinic',
          initials: 'DV',
          expiresIn: '45m',
          expiresDate: 'Today',
          scopesSummary: '1 RECORD',
          tokenCode: 'TK-1',
          tokenHash: '0x1',
          purpose: 'Consultation',
          revoked: false,
        },
        {
          id: 'd2',
          recipientName: 'Old Share',
          facility: 'Lab',
          initials: 'OS',
          expiresIn: '0m',
          expiresDate: 'Yesterday',
          scopesSummary: '1 RECORD',
          tokenCode: 'TK-2',
          tokenHash: '0x2',
          purpose: 'Lab',
          revoked: true,
        },
      ],
      appointments: [
        {
          id: 'a1',
          title: 'Follow-up Consultation',
          clinicianOrFacility: 'Dr. Mehta',
          category: 'consultation',
          scheduledDate: '2026-11-20',
          scheduledTime: '10:00 AM',
          status: 'upcoming',
        },
        {
          id: 'a2',
          title: 'Completed Blood Test',
          clinicianOrFacility: 'Path Lab',
          category: 'lab',
          scheduledDate: '2026-10-01',
          scheduledTime: '08:00 AM',
          status: 'completed',
        },
      ],
      notifications: [
        {
          id: 'n1',
          title: 'Saved',
          message: 'Record encrypted',
          type: 'info',
          read: false,
          createdAt: '2026-11-01T10:00:00Z',
        },
        {
          id: 'n2',
          title: 'Older',
          message: 'Old event',
          type: 'info',
          read: true,
          createdAt: '2026-10-01T10:00:00Z',
        },
      ],
      medicines: [
        {
          id: 'm1',
          name: 'Paracetamol',
          system: 'allopathy',
          genericOrActiveSalt: 'Paracetamol',
          dosageForm: 'Tablet',
          strengthOrPotency: '500 mg',
          isActive: true,
        },
        {
          id: 'm2',
          name: 'Stopped Course',
          system: 'allopathy',
          genericOrActiveSalt: 'Azithromycin',
          dosageForm: 'Tablet',
          strengthOrPotency: '500 mg',
          isActive: false,
        },
      ],
    });

    assert.deepEqual(populated, {
      totalRecordsCount: 2,
      prescriptionsCount: 1,
      vaccinesCount: 1,
      dueVaccinesCount: 1,
      activeSharesCount: 1,
      upcomingAppointmentsCount: 1,
      unreadNotificationsCount: 1,
      activeMedicinesCount: 1,
    });
  });

  test('Supabase operations return explicit configuration errors instead of fake success when unconfigured', async () => {
    const status = getDatabaseConnectionSummary();
    assert.equal(status.configured, false);
    assert.ok(status.errorMessage?.includes('VITE_SUPABASE_URL'));

    const recordsRes = await fetchHealthRecords('usr-1');
    assert.equal(recordsRes.isConfigured, false);
    assert.equal(recordsRes.data, null);
    assert.ok(recordsRes.error);

    const uploadRes = await uploadProfilePhotoToSupabase(
      'usr-1',
      new Blob(['img'], { type: 'image/jpeg' }),
      'jpg'
    );
    assert.equal(uploadRes.isConfigured, false);
    assert.equal(uploadRes.data, null);
    assert.ok(uploadRes.error);

    const removeRes = await removeProfilePhotoFromSupabase('usr-1', 'usr-1/profile-photo.jpg');
    assert.equal(removeRes.isConfigured, false);
    assert.equal(removeRes.data, null);
    assert.ok(removeRes.error);
  });
});
