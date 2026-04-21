export default {
  async afterCreate(event) {
    await upsertPendingNotification(event.result);
  },
  async afterUpdate(event) {
    await upsertPendingNotification(event.result);
  },
  async afterDelete(event) {
    await deletePendingNotification(String(event.result.id));
  },
};

async function upsertPendingNotification(task: any) {
  if (!task?.id) return;

  const taskId = String(task.id);
  const completed = task.completed ?? false;
  const reminderDate = task.reminderDate ?? null;
  const taskDate = task.taskDate ?? null;
  const notificationOffset = task.notificationOffset ?? null;

  let notifyAt: string | null = null;

  if (reminderDate) {
    notifyAt = new Date(reminderDate).toISOString();
  } else if (taskDate && notificationOffset != null) {
    const d = new Date(taskDate);
    d.setMinutes(d.getMinutes() - notificationOffset);
    notifyAt = d.toISOString();
  }

  if (!notifyAt || completed || new Date(notifyAt) < new Date()) {
    await deletePendingNotification(taskId);
    return;
  }

  const uid = 'api::pending-notification.pending-notification';
  const existing = await strapi.db.query(uid).findOne({ where: { taskId } });

  const payload = {
    taskId,
    title: task.title ?? 'Rappel',
    body: task.description
      ? String(task.description).substring(0, 100)
      : `Tâche prévue pour ${new Date(taskDate).toLocaleString('fr')}`,
    notifyAt,
    userId: String(task.userId ?? ''),
    delivered: false,
  };

  if (existing) {
    await strapi.db.query(uid).update({ where: { id: existing.id }, data: payload });
  } else {
    await strapi.db.query(uid).create({ data: payload });
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