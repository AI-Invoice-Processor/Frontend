import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import {
  CausationPage,
  InvoicesPage,
  AnalysisPage,
  Shell,
  UploadPage,
} from "../features/invoices/pages";
const rootRoute = createRootRoute({
  component: () => (
    <Shell>
      <Outlet />
    </Shell>
  ),
});
const invoicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/facturas",
  component: InvoicesPage,
});
const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/facturas/nueva",
  component: UploadPage,
});
const analysisRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/facturas/$invoiceId/analisis",
  component: AnalysisPage,
});
const causationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/facturas/$invoiceId/causacion",
  component: CausationPage,
});
const routeTree = rootRoute.addChildren([
  invoicesRoute,
  uploadRoute,
  analysisRoute,
  causationRoute,
]);
export const router = createRouter({ routeTree, defaultPreload: "intent" });
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
