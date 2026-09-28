export function getHomeRouteForRole(role) {
  switch (role) {
    case 'Customer':
      return '/portal/customer/home';
    case 'Field Engineer':
      return '/portal/engineer/jobs';
    default:
      return '/dashboard/cockpit';
  }
}
