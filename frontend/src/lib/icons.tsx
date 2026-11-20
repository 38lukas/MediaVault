// Every icon used in the app is declared here and imported from '@/lib/icons', so all icons live in one spot:
// swap an icon once and it changes everywhere. Do not import from '@mui/icons-material' anywhere else.

import type { ElementType } from 'react';
import { SvgIcon, type SvgIconProps } from '@mui/material';
import type { SortField, TypeFilter } from '@/types/media';
import { default as AppsOutlined } from '@mui/icons-material/AppsOutlined';
import { default as AutoAwesomeOutlined } from '@mui/icons-material/AutoAwesomeOutlined';
import { default as CalendarMonthOutlined } from '@mui/icons-material/CalendarMonthOutlined';
import { default as CheckCircleOutlineOutlined } from '@mui/icons-material/CheckCircleOutlineOutlined';
import { default as DateRangeOutlined } from '@mui/icons-material/DateRangeOutlined';
import { default as FlagOutlined } from '@mui/icons-material/FlagOutlined';
import { default as HistoryOutlined } from '@mui/icons-material/HistoryOutlined';
import { default as MenuBookOutlined } from '@mui/icons-material/MenuBookOutlined';
import { default as MovieOutlined } from '@mui/icons-material/MovieOutlined';
import { default as PlayCircleOutlineOutlined } from '@mui/icons-material/PlayCircleOutlineOutlined';
import { default as SortByAlpha } from '@mui/icons-material/SortByAlpha';
import { default as SportsEsportsOutlined } from '@mui/icons-material/SportsEsportsOutlined';
import { default as StarBorder } from '@mui/icons-material/StarBorder';
import { default as TvOutlined } from '@mui/icons-material/TvOutlined';

// ---------------------------------------------------------------- Material icons
export { default as AddIcon } from '@mui/icons-material/Add';
export { default as AppsOutlinedIcon } from '@mui/icons-material/AppsOutlined';
export { default as ArrowBackIcon } from '@mui/icons-material/ArrowBack';
export { default as ArrowDownwardIcon } from '@mui/icons-material/ArrowDownward';
export { default as ArrowForwardIcon } from '@mui/icons-material/ArrowForward';
export { default as ArrowRightAltIcon } from '@mui/icons-material/ArrowRightAlt';
export { default as ArrowUpwardIcon } from '@mui/icons-material/ArrowUpward';
export { default as AutoAwesomeOutlinedIcon } from '@mui/icons-material/AutoAwesomeOutlined';
export { default as CalendarMonthOutlinedIcon } from '@mui/icons-material/CalendarMonthOutlined';
export { default as CalendarTodayOutlinedIcon } from '@mui/icons-material/CalendarTodayOutlined';
export { default as CheckCircleOutlineOutlinedIcon } from '@mui/icons-material/CheckCircleOutlineOutlined';
export { default as CheckIcon } from '@mui/icons-material/Check';
export { default as CloseIcon } from '@mui/icons-material/Close';
export { default as DateRangeOutlinedIcon } from '@mui/icons-material/DateRangeOutlined';
export { default as DeleteOutlinedIcon } from '@mui/icons-material/DeleteOutlined';
export { default as DragIndicatorIcon } from '@mui/icons-material/DragIndicator';
export { default as EditOutlinedIcon } from '@mui/icons-material/EditOutlined';
export { default as ExpandMoreIcon } from '@mui/icons-material/ExpandMore';
export { default as FavoriteBorderIcon } from '@mui/icons-material/FavoriteBorder';
export { default as FavoriteIcon } from '@mui/icons-material/Favorite';
export { default as FilterListOffIcon } from '@mui/icons-material/FilterListOff';
export { default as FlagOutlinedIcon } from '@mui/icons-material/FlagOutlined';
export { default as FormatListBulletedOutlinedIcon } from '@mui/icons-material/FormatListBulletedOutlined';
export { default as HistoryOutlinedIcon } from '@mui/icons-material/HistoryOutlined';
export { default as InfoOutlinedIcon } from '@mui/icons-material/InfoOutlined';
export { default as KeyboardArrowDownIcon } from '@mui/icons-material/KeyboardArrowDown';
export { default as KeyboardArrowUpIcon } from '@mui/icons-material/KeyboardArrowUp';
export { default as ListAltIcon } from '@mui/icons-material/ListAlt';
export { default as MenuBookOutlinedIcon } from '@mui/icons-material/MenuBookOutlined';
export { default as MovieOutlinedIcon } from '@mui/icons-material/MovieOutlined';
export { default as PaletteIcon } from '@mui/icons-material/Palette';
export { default as PeopleOutlinedIcon } from '@mui/icons-material/PeopleOutlined';
export { default as PersonAddOutlinedIcon } from '@mui/icons-material/PersonAddOutlined';
export { default as PersonIcon } from '@mui/icons-material/Person';
export { default as PersonOutlinedIcon } from '@mui/icons-material/PersonOutlined';
export { default as PlayCircleOutlineOutlinedIcon } from '@mui/icons-material/PlayCircleOutlineOutlined';
export { default as RemoveIcon } from '@mui/icons-material/Remove';
export { default as ReplayIcon } from '@mui/icons-material/Replay';
export { default as SearchIcon } from '@mui/icons-material/Search';
export { default as SettingsIcon } from '@mui/icons-material/Settings';
export { default as SortByAlphaIcon } from '@mui/icons-material/SortByAlpha';
export { default as SportsEsportsOutlinedIcon } from '@mui/icons-material/SportsEsportsOutlined';
export { default as StarBorderIcon } from '@mui/icons-material/StarBorder';
export { default as TvOutlinedIcon } from '@mui/icons-material/TvOutlined';
export { default as VisibilityIcon } from '@mui/icons-material/Visibility';
export { default as VisibilityOffIcon } from '@mui/icons-material/VisibilityOff';

// ---------------------------------------------------------------- Custom icons
// Bookshelf, used for the Library (header navigation and settings).
export function BookshelfIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <rect x={5} y={3.5} width={14} height={5} rx={0.7} />
        <path d="M7.25 3.5v5" />
        <rect x={3.5} y={9.5} width={15} height={5} rx={0.7} />
        <path d="M5.75 9.5v5" />
        <rect x={4.5} y={15.5} width={16} height={5} rx={0.7} />
        <path d="M6.75 15.5v5" />
      </g>
    </SvgIcon>
  );
}

// ---------------------------------------------------------------- Icon sets by purpose
// Library media type filter chips.
export const TYPE_FILTER_ICONS: Record<TypeFilter, ElementType> = {
  All: AppsOutlined,
  'Game/DLC': SportsEsportsOutlined,
  Movie: MovieOutlined,
  Series: TvOutlined,
  Anime: AutoAwesomeOutlined,
  Book: MenuBookOutlined,
};

// "Sort by" options (library toolbar and the default-sort setting).
export const SORT_FIELD_ICONS: Record<SortField, ElementType> = {
  status: FlagOutlined,
  title: SortByAlpha,
  rating: StarBorder,
  started_at: PlayCircleOutlineOutlined,
  finished_at: CheckCircleOutlineOutlined,
  last_played: HistoryOutlined,
  months: CalendarMonthOutlined,
  year: DateRangeOutlined,
};
