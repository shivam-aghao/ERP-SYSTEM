import { supabase } from '../config/supabaseClient.js';
import { logger } from '../middlewares/logger.middleware.js';

export const realtimeService = {
  subscribeToAttendance(sessionId, callback) {
    if (!supabase) {
      logger.warn('Realtime subscription skipped: Supabase client unavailable');
      return null;
    }

    try {
      const channel = supabase
        .channel(`session-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance_records',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            logger.info(`Realtime attendance update received for session ${sessionId}`);
            callback(payload);
          }
        )
        .subscribe();

      return channel;
    } catch (err) {
      logger.error('Failed to subscribe to attendance realtime events', err);
      return null;
    }
  },

  subscribeToNotifications(facultyId, callback) {
    if (!supabase) return null;

    try {
      const channel = supabase
        .channel(`faculty-notifs-${facultyId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_faculty_id=eq.${facultyId}`,
          },
          (payload) => {
            callback(payload);
          }
        )
        .subscribe();

      return channel;
    } catch (err) {
      logger.error('Failed to subscribe to notification events', err);
      return null;
    }
  },

  async unsubscribe(channel) {
    if (channel && supabase) {
      await supabase.removeChannel(channel);
    }
  },
};

export default realtimeService;

