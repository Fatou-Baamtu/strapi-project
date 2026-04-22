// Toutes les minutes, Strapi vérifie les pending-notifications
// dont notifyAt <= maintenant et les marque "ready" (delivered = false mais prêtes).

export default {
  myNotificationCron: {
    task: async ({ strapi }) => {
      const now = new Date().toISOString();
      const uid = 'api::pending-notification.pending-notification';

      const due = await strapi.db.query(uid).findMany({
        where: {
          delivered: false,
          notifyAt: { $lte: now },
        },
      });

      if (due.length === 0) return;

      strapi.log.info(`🔔 Cron: ${due.length} notification(s) prête(s)`);
    },
    options: {
      rule: '* * * * *', // toutes les minutes
    },
  },
};
