import { factories } from '@strapi/strapi';
import { Context } from 'koa';

const uid = 'api::pending-notification.pending-notification';

export default factories.createCoreController(uid, ({ strapi }) => ({

  async myPending(ctx: Context) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Non authentifié');

    const now = new Date().toISOString();

    const results = await strapi.db.query(uid).findMany({
      where: {
        userId: String(user.id),
        delivered: false,
        notifyAt: { $gt: now },
      },
      orderBy: { notifyAt: 'asc' },
    });

    return ctx.send({ data: results });
  },

  async markDelivered(ctx: Context) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Non authentifié');

    const { taskId } = ctx.params;

    const entry = await strapi.db.query(uid).findOne({
      where: { taskId: String(taskId), userId: String(user.id) },
    });

    if (!entry) return ctx.notFound('Notification introuvable');

    await strapi.db.query(uid).update({
      where: { id: entry.id },
      data: { delivered: true },
    });

    return ctx.send({ success: true });
  },

}));