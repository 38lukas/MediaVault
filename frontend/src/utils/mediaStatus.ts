// Return soft status colors for chips and badges
export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'watching':
    case 'playing':
    case 'reading':
    case 'active':
      return {
        bg: 'rgba(2, 150, 225, 0.22)',
        border: 'rgba(2, 150, 225, 0.42)',
        color: '#64b5f6',
      };
    case 'finished':
    case 'watched':
    case 'read':
      return {
        bg: 'rgba(56, 142, 60, 0.22)',
        border: 'rgba(56, 142, 60, 0.42)',
        color: '#81c784',
      };
    case 'dropped':
      return {
        bg: 'rgba(229, 57, 53, 0.22)',
        border: 'rgba(229, 57, 53, 0.42)',
        color: '#e57373',
      };
    case 'shelved':
      return {
        bg: 'rgba(245, 124, 0, 0.22)',
        border: 'rgba(245, 124, 0, 0.42)',
        color: '#ffb74d',
      };
    case 'played':
      return {
        bg: 'rgba(156, 39, 176, 0.2)',
        border: 'rgba(156, 39, 176, 0.4)',
        color: '#ba68c8',
      };
    case 'backlog':
    case 'watchlist':
    case 'queue':
      return {
        bg: 'rgba(96, 125, 139, 0.2)',
        border: 'rgba(96, 125, 139, 0.4)',
        color: '#90a4ae',
      };
    case 'wishlist':
      return {
        bg: 'rgba(158, 158, 158, 0.16)',
        border: 'rgba(158, 158, 158, 0.32)',
        color: '#9e9e9e',
      };
    default:
      return {
        bg: 'rgba(255, 255, 255, 0.08)',
        border: 'rgba(255, 255, 255, 0.16)',
        color: '#bdbdbd',
      };
  }
}
