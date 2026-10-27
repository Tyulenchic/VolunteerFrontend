import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, type RouteObject } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";

type Entry = string | { pathname: string; search?: string; state?: unknown };

/** Рендер маршрутов с реальными AuthProvider/NotificationProvider; возвращает router для проверки навигации. */
export function renderRoutes(routes: RouteObject[], initialEntries: Entry[] = ["/"]) {
  const router = createMemoryRouter(routes, { initialEntries: initialEntries as never });
  const utils = render(
    <NotificationProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </NotificationProvider>
  );
  return { router, ...utils };
}
