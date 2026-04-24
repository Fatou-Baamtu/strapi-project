export default {
  async afterCreate(event) {
    const task = event.result;

    if (!task || !task.documentId) return;

    strapi.log.info(`🧠 [Task Lifecycle] afterCreate: docId=${task.documentId}, id=${task.id}, publishedAt=${task.publishedAt}`);
    await upsertPendingNotification(task);
  },

  async afterUpdate(event) {
    const task = event.result;
    if (!task || !task.documentId) return;
    
    strapi.log.info(`🧠 [Task Lifecycle] afterUpdate: docId=${task.documentId}`);
    await upsertPendingNotification(task);
  },

  async afterDelete(event) {
    const task = event.result;
    if (task && task.documentId) {
      strapi.log.info(`🗑️ [Task Lifecycle] afterDelete: docId=${task.documentId}`);
      await deletePendingNotification(task.documentId);
    }
  },
};

async function upsertPendingNotification(task: any) {
  const uid = 'api::pending-notification.pending-notification';
  const taskIdString = String(task.documentId);

  try {
    // 1. Check if task is completed
    if (task.completed) {
      const existing = await strapi.documents(uid).findFirst({
        filters: { taskId: taskIdString }
      });
      if (existing) {
        await strapi.documents(uid).delete({ documentId: existing.documentId });
      }
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
    };

    // 3. Find Existing Notification linked to this task document
    const existing = await strapi.documents(uid).findFirst({
      filters: { taskId: taskIdString }
    });

    if (existing) {
      strapi.log.info(`🔄 Updating notification for task ${taskIdString}`);
      await strapi.documents(uid).update({
        documentId: existing.documentId,
        data: payload,
        status: 'published'
      });
    } else {
      strapi.log.info(`✨ Creating new notification for task ${taskIdString}`);
      await strapi.documents(uid).create({
        data: payload,
        status: 'published'
      });
    }
  } catch (error) {
    strapi.log.error(`❌ Error in upsertPendingNotification: ${error.message}`);
  }
}

async function deletePendingNotification(taskDocumentId: string) {
  try {
    const uid = 'api::pending-notification.pending-notification';
    const existing = await strapi.documents(uid).findFirst({
      filters: { taskId: taskDocumentId }
    });
    if (existing) {
      await strapi.documents(uid).delete({ documentId: existing.documentId });
    }
  } catch (error) {
    strapi.log.error(`❌ Error in deletePendingNotification: ${error.message}`);
  }
}