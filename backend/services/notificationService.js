/**
 * AgriWise: Notification and Messaging Service
 * Coordinates recommendation dispatch, message generation, and farmer in-app alerts.
 */

const db = require('../config/db');

class NotificationService {
  /**
   * Dispatch an approved recommendation to the farmer
   */
  async sendRecommendationToFarmer(recommendationId, adminId) {
    // 1. Fetch recommendation details
    const recRows = await db.query(
      `SELECT r.*, st.sample_id, f.farm_name, fd.field_name, fd.current_crop, u.name as farmer_name
       FROM fertilizer_recommendations r
       JOIN soil_tests st ON r.soil_test_id = st.id
       JOIN farms f ON r.farm_id = f.id
       JOIN fields fd ON r.field_id = fd.id
       JOIN users u ON r.farmer_id = u.id
       WHERE r.id = ?`,
      [recommendationId]
    );

    if (!recRows || recRows.length === 0) {
      throw new Error('Recommendation not found.');
    }
    const rec = recRows[0];

    if (rec.status !== 'APPROVED') {
      throw new Error(`Recommendation cannot be sent because its status is '${rec.status}'. It must be APPROVED first.`);
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // 2. Update recommendation status to SENT
    await db.query(
      `UPDATE fertilizer_recommendations
       SET status = 'SENT', sent_at = ?, admin_id = ?
       WHERE id = ?`,
      [now, adminId, recommendationId]
    );

    // 3. Update soil test status to COMPLETED
    await db.query(
      "UPDATE soil_tests SET status = 'APPROVED', updated_at = ? WHERE id = ?",
      [now, rec.soil_test_id]
    );

    // 4. Create message for the farmer
    const subject = `New Fertilizer Recommendation for ${rec.field_name || 'Field'}`;
    const messageContent =
      `Your soil test for ${rec.field_name || 'your field'} (Sample ID: ${rec.sample_id || 'N/A'}) has been analyzed. ` +
      `The analysis indicates that ${rec.priority_nutrient || 'soil nutrients'} require attention. ` +
      `Your explainable fertilizer recommendation and multi-stage schedule are now ready.`;

    const msgResult = await db.query(
      `INSERT INTO messages (farmer_id, admin_id, recommendation_id, subject, message, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, FALSE, ?)`,
      [rec.farmer_id, adminId, recommendationId, subject, messageContent, now]
    );
    const messageId = msgResult.insertId;

    // 5. Create notification for the farmer dashboard
    const notifTitle = 'New Recommendation Ready';
    const notifBody = `Your fertilizer plan is ready for ${rec.field_name || 'your field'}.`;
    const notifLink = `/farmer/recommendation.html?id=${recommendationId}`;

    const notifResult = await db.query(
      `INSERT INTO notifications (farmer_id, message_id, type, title, message, link, is_read, created_at)
       VALUES (?, ?, 'recommendation_ready', ?, ?, ?, FALSE, ?)`,
      [rec.farmer_id, messageId, notifTitle, notifBody, notifLink, now]
    );
    const notificationId = notifResult.insertId;

    return {
      success: true,
      recommendationId,
      farmerId: rec.farmer_id,
      messageId,
      notificationId,
      status: 'SENT'
    };
  }

  /**
   * Send custom agronomist advisory message to farmer
   */
  async sendCustomAdvisory(farmerId, adminId, subject, messageText, recommendationId = null) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const msgResult = await db.query(
      `INSERT INTO messages (farmer_id, admin_id, recommendation_id, subject, message, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, FALSE, ?)`,
      [farmerId, adminId, recommendationId, subject, messageText, now]
    );
    const messageId = msgResult.insertId;

    await db.query(
      `INSERT INTO notifications (farmer_id, message_id, type, title, message, link, is_read, created_at)
       VALUES (?, ?, 'new_message', ?, ?, '/farmer/messages.html', FALSE, ?)`,
      [farmerId, messageId, subject, messageText.substring(0, 100), now]
    );

    return { messageId };
  }
}

module.exports = new NotificationService();
