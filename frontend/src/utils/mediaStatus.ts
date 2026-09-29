/** Returns soft status colors for chips and badges.
 *
 *  @param status - Media status label (e.g. "Playing").
 *  @returns Background, border, and text colors.
 */
export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'watching':
    case 'playing':
      return {
        bg: 'rgba(2, 150, 225, 0.22)',
        border: 'rgba(2, 150, 225, 0.42)',
        color: '#64b5f6',
      };
    case 'finished':
    case 'watched':
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
    case 'backlog':
      return {
        bg: 'rgba(156, 39, 176, 0.2)',
        border: 'rgba(156, 39, 176, 0.4)',
        color: '#ba68c8',
      };
    case 'wishlist':
    case 'watchlist':
      return {
        bg: 'rgba(63, 81, 181, 0.2)',
        border: 'rgba(63, 81, 181, 0.4)',
        color: '#7986cb',
      };
    default:
      return {
        bg: 'rgba(255, 255, 255, 0.08)',
        border: 'rgba(255, 255, 255, 0.16)',
        color: '#bdbdbd',
      };
  }
}
