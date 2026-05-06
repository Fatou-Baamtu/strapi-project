/**
 * task controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::task.task', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;

    // Si l'utilisateur est authentifié et n'est pas un admin, on filtre par son ID
    if (user && user.role?.type !== 'admin') {
      ctx.query.filters = {
        ...(ctx.query.filters as any),
        userId: user.id.toString(),
      };
    }

    return await super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (user && user.role?.type !== 'admin') {
      // On vérifie si la tâche appartient à l'utilisateur avant de laisser le core controller agir
      // Note: On utilise documentId pour Strapi 5
      const entity = await strapi.documents('api::task.task').findOne({
        documentId: id,
        filters: { userId: user.id.toString() },
      });

      if (!entity) {
        return ctx.notFound('Task not found or access denied');
      }
    }

    return await super.findOne(ctx);
  },

  async create(ctx) {
    const user = ctx.state.user;

    if (user) {
      // On force le userId à être celui de l'utilisateur connecté
      if (!ctx.request.body.data) ctx.request.body.data = {};
      ctx.request.body.data.userId = user.id.toString();
    }

    return await super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (user && user.role?.type !== 'admin') {
      const entity = await strapi.documents('api::task.task').findOne({
        documentId: id,
        filters: { userId: user.id.toString() },
      });

      if (!entity) {
        return ctx.forbidden('You can only update your own tasks');
      }
    }

    return await super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (user && user.role?.type !== 'admin') {
      const entity = await strapi.documents('api::task.task').findOne({
        documentId: id,
        filters: { userId: user.id.toString() },
      });

      if (!entity) {
        return ctx.forbidden('You can only delete your own tasks');
      }
    }

    return await super.delete(ctx);
  },
}));
