import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PushNotificationService } from '../modules/notifications/pushNotificationService.js';
import { NotificationTemplates } from '../modules/notifications/notificationTemplates.js';
import { Notification } from '../models/Notification.js';
import { PushSubscription } from '../models/PushSubscription.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { User } from '../models/User.js';
import { PharmacyInventory } from '../models/PharmacyInventory.js';
import { ExpiryNotificationJob } from '../modules/notifications/expiryNotificationJob.js';

describe('Push Notification System Integration Tests', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('1. should return a valid public VAPID key', () => {
    const publicKey = PushNotificationService.getPublicKey();
    expect(publicKey).toBeDefined();
    expect(typeof publicKey).toBe('string');
    expect(publicKey.length).toBeGreaterThan(20);
  });

  it('2. should save a browser push subscription for a user', async () => {
    const user = await User.create({
      name: 'Dr. Test Pharmacist',
      email: 'test-pharm@pharmamatch.ai',
      password: 'password123',
      role: 'PHARMACIST'
    });

    const fakeSub = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-sub-12345',
      keys: {
        p256dh: 'BNhuMXcIPbqG6SYrgnoI6arrCZ5T6Y7G8-APHTkH8du94j4fw_36ivpbfb2tXyb8oObORPiNWXPth02ih3_4-iE',
        auth: '3F-XW9zQYgmckMxGehzZMPrz'
      }
    };

    const saved = await PushNotificationService.subscribe(
      String(user._id),
      fakeSub,
      'Chrome on Windows',
      'Chrome'
    );

    expect(saved).toBeDefined();
    expect(saved.userId).toBe(String(user._id));
    expect(saved.isActive).toBe(true);

    const fromDb = await PushSubscription.findOne({ endpoint: fakeSub.endpoint });
    expect(fromDb).not.toBeNull();
    expect(fromDb?.userId).toBe(String(user._id));
  });

  it('3. should handle user preferences and toggles', async () => {
    const userId = 'user-pref-test-001';
    const prefs = await PushNotificationService.getPreferences(userId);

    expect(prefs.lowStock).toBe(true);
    expect(prefs.outOfStock).toBe(true);
    expect(prefs.enabledAll).toBe(true);

    // Update preferences
    await PushNotificationService.updatePreferences(userId, { lowStock: false });
    const updated = await PushNotificationService.getPreferences(userId);
    expect(updated.lowStock).toBe(false);

    // Verify preference check helper
    const allowed = await PushNotificationService.isNotificationEnabledForUser(userId, 'LOW_STOCK');
    expect(allowed).toBe(false);

    const allowedOut = await PushNotificationService.isNotificationEnabledForUser(userId, 'OUT_OF_STOCK');
    expect(allowedOut).toBe(true);
  });

  it('4. should create persistent notification records when sending notifications', async () => {
    const userId = 'user-notif-record-test';
    const payload = NotificationTemplates.LOW_STOCK('Brufen 400mg', 2, 5, 'med-brufen-01');

    const res = await PushNotificationService.sendToUser(userId, payload);
    expect(res.success).toBe(true);
    expect(res.notificationId).toBeDefined();

    const notif = await Notification.findById(res.notificationId);
    expect(notif).not.toBeNull();
    expect(notif?.type).toBe('LOW_STOCK');
    expect(notif?.data?.medicineName).toBe('Brufen 400mg');
    expect(notif?.data?.currentStock).toBe(2);
    expect(notif?.isRead).toBe(false);
  });

  it('5. should evaluate expiring medicines and prevent duplicate alerts', async () => {
    await PharmacyInventory.create({
      pharmacyId: 'main-pharmacy',
      drugProductId: 'drug-exp-test-1',
      productName: 'Cataflam 50mg',
      quantity: 15,
      price: 45,
      batchNumber: 'BATCH-CATA-2026',
      expirationDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days left -> 7_DAYS tier
      minimumStockLevel: 5,
      status: 'AVAILABLE'
    });

    const run1 = await ExpiryNotificationJob.runCheck();
    expect(run1.evaluated).toBeGreaterThan(0);
    expect(run1.alertsSent).toBeGreaterThan(0);

    // Immediate second run should send 0 duplicate alerts
    const run2 = await ExpiryNotificationJob.runCheck();
    expect(run2.alertsSent).toBe(0);
  });
});
