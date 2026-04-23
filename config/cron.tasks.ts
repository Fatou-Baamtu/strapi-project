export default {
  notifyDispatcher: {
    task: async ({ strapi }) => {
      strapi.log.info("⏰ CRON EXECUTED");

      const now = new Date();
      const uid = 'api::pending-notification.pending-notification';

      const due = await strapi.db.query(uid).findMany({
        where: {
          delivered: false,
          notifyAt: { $lte: now.toISOString() },
          attempts: { $lt: 3 },
        },
      });

      for (const notif of due) {
        try {
          strapi.log.info(`📣 Sending notif ${notif.taskId}`);

          await strapi.db.query(uid).update({
            where: { id: notif.id },
            data: {
              delivered: true,
            },
          });

        } catch (err) {
          await strapi.db.query(uid).update({
            where: { id: notif.id },
            data: {
              attempts: (notif.attempts ?? 0) + 1,
              lastError: String(err),
            },
          });
        }
      }
    },

    options: {
      rule: '* * * * *', // chaque minute
    },
  },
};