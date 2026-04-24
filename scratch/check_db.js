
export default async ({ strapi }) => {
  const notifications = await strapi.db.query('api::pending-notification.pending-notification').findMany();
  console.log('--- ALL NOTIFICATIONS ---');
  console.log(JSON.stringify(notifications, null, 2));
  
  const tasks = await strapi.db.query('api::task.task').findMany({ limit: 5 });
  console.log('--- LATEST TASKS ---');
  console.log(JSON.stringify(tasks, null, 2));
};
