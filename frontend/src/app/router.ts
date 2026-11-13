import { createElement } from "react";
import { Navigate, createBrowserRouter } from "react-router";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { ROUTES, buildRoute } from "../routes";
import { AppProviders } from "./AppProviders";
import { ProtectedApplication } from "./ProtectedApplication";

export const router = createBrowserRouter([
  {
    path: ROUTES.ROOT,
    Component: AppProviders,
    children: [
      {
        index: true,
        element: createElement(Navigate, { to: buildRoute(ROUTES.LOGIN), replace: true }),
      },
      { path: ROUTES.LOGIN, Component: LoginPage },
      { path: "*", Component: ProtectedApplication },
    ],
  },
]);
