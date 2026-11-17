self.addEventListener("push", (event) => {
  let datos = { title: "Nuevo mensaje", body: "Pensé en ti", url: "/" };
  try {
    datos = event.data ? { ...datos, ...event.data.json() } : datos;
  } catch {}

  event.waitUntil(
    self.registration.showNotification(datos.title, {
      body: datos.body,
      icon: "/icons/192",
      badge: "/icons/96",
      vibrate: [120, 60, 120],
      tag: datos.url,
      renotify: true,
      data: { url: datos.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (ventanas) => {
      for (const v of ventanas) {
        if ("focus" in v) {
          await v.focus();
          if ("navigate" in v && v.url !== url) await v.navigate(url).catch(() => {});
          return;
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
