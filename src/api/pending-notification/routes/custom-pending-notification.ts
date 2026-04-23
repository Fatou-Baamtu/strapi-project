
export default {
  routes: [
    {
      method: 'GET',
      path: '/my-pending-notifications',
      handler: 'pending-notification.myPending',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/my-pending-notifications/:taskId/delivered',
      handler: 'pending-notification.markDelivered',
      config: { policies: [], middlewares: [] },
    },
    {
    method: 'GET',
    path: '/my-due-notifications',
    handler: 'pending-notification.myDue',
    config: { policies: [], middlewares: [] },
},
  ],
};
