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
        bg: 'rgba(2, 136, 209, 0.18)',
        border: 'rgba(2, 136, 209, 0.35)',
        color: '#90caf9',
      };
    case 'finished':
    case 'watched':
      return {
        bg: 'rgba(46, 125, 50, 0.18)',
        border: 'rgba(46, 125, 50, 0.35)',
        color: '#a5d6a7',
      };
    case 'dropped':
      return {
        bg: 'rgba(211, 47, 47, 0.18)',
        border: 'rgba(211, 47, 47, 0.35)',
        color: '#ef9a9a',
      };
    case 'shelved':
      return {
        bg: 'rgba(237, 108, 2, 0.18)',
        border: 'rgba(237, 108, 2, 0.35)',
        color: '#ffcc80',
      };
    case 'backlog':
    case 'wishlist':
    case 'watchlist':
      return {
        bg: 'rgba(255, 255, 255, 0.08)',
        border: 'rgba(255, 255, 255, 0.16)',
        color: '#bdbdbd',
      };
    default:
      return {
        bg: 'rgba(255, 255, 255, 0.08)',
        border: 'rgba(255, 255, 255, 0.16)',
        color: '#bdbdbd',
      };
  }
}
