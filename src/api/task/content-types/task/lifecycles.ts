export default {
  async afterCreate(event) {
    const task = event.result;

    if (!task || !task.documentId) return;

    strapi.log.info(`🧠 TASK CREATED documentId=${task.documentId} id=${task.id} locale=${task.locale} publishedAt=${task.publishedAt}`);
  
    await upsertPendingNotification(task);
  },
  async afterUpdate(event) {
    await upsertPendingNotification(event.result);
  },
  async afterDelete(event) {
    if (event.result && event.result.documentId) {
      strapi.log.info(`🗑️ TASK DELETED ${event.result.documentId}`);
      await deletePendingNotification(String(event.result.documentId));
    }
  },
};

async function upsertPendingNotification(task: any) {
  if (!task?.documentId) return;

  try {
    const uid = 'api::pending-notification.pending-notification';
    const taskIdString = String(task.documentId); // Use documentId instead of id

    if (task.completed) {
      await strapi.db.query(uid).deleteMany({ where: { taskId: taskIdString } });
      return;
    }

    const taskDate = task.taskDate ? new Date(task.taskDate) : new Date();
    const offset = task.notificationOffset ?? 0;

    const notifyAt = new Date(taskDate);
    if (!isNaN(notifyAt.getTime())) {
      notifyAt.setMinutes(notifyAt.getMinutes() - offset);
    }

    const payload = {
      taskId: taskIdString,
      userId: task.userId ? String(task.userId) : 'system',
      title: task.title ?? 'Rappel',
      body: task.description?.substring(0, 120) ?? '',
      notifyAt: isNaN(notifyAt.getTime()) ? new Date().toISOString() : notifyAt.toISOString(),
      delivered: false,
      publishedAt: new Date().toISOString(),
    };

    const existing = await strapi.db.query(uid).findOne({
      where: { taskId: taskIdString },
    });

    if (existing) {
      await strapi.db.query(uid).update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await strapi.db.query(uid).create({ data: payload });
    }
  } catch (error) {
    strapi.log.error(`❌ Error in upsertPendingNotification: ${error.message}`);
  }
}

async function deletePendingNotification(taskId: string) {
  try {
    const uid = 'api::pending-notification.pending-notification';
    const existing = await strapi.db.query(uid).findOne({ where: { taskId } });
    if (existing) {
      await strapi.db.query(uid).delete({ where: { id: existing.id } });
    }
  } catch (_) {}
}