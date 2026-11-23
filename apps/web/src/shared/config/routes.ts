/** App routes in one place, so slices don't hardcode paths that belong to the `app` layer. */
export const ROUTES = {
  transactions: '/',
  categories: '/categories',
  login: '/auth/login',
  /** Route handler that ends the session (Server Components can't delete cookies). */
  signout: '/auth/signout',
} as const;
