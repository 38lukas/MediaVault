'use client';

import { useState, type FormEvent } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';
import { StarRating } from '@/components/common/StarRating';
import { MediaCard } from '@/components/media/MediaCard';
import { palette } from '@/lib/palette';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  useAddMediaListItemMutation,
  useCreateMediaListMutation,
  useDeleteMediaListMutation,
  useGetMediaEntriesQuery,
  useGetMediaListsQuery,
  useRemoveMediaListItemMutation,
  useReorderMediaListMutation,
  useUpdateMediaListMutation,
} from '@/redux/api';
import { openEditMediaModal } from '@/redux/slices/mediaModalSlice';
import type { MediaList, MediaListItem } from '@/types/lists';
import { mediaDisplayTitle, type MediaItem } from '@/types/media';
import { getApiErrorMessage } from '@/utils/apiError';
import { getStatusColor } from '@/utils/mediaStatus';

const FALLBACK_POSTER = 'https://via.placeholder.com/300x450?text=No+Cover';

const VIEW_COLS = { xs: 6, sm: 4, md: 3, lg: 2.4, xl: 2 } as const;

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    backgroundColor: palette.fieldBg,
  },
} as const;

function titleCount(count: number): string {
  if (count === 0) return 'Empty';
  return count === 1 ? '1 title' : `${count} titles`;
}

function moveItem(items: MediaListItem[], from: number, to: number): MediaListItem[] | null {
  if (to < 0 || to >= items.length || from === to) return null;
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  if (!moved) return null;
  next.splice(to, 0, moved);
  return next;
}

// Create and edit share one dialog; the parent owns the field values.
function ListFormDialog({
  open,
  title,
  submitLabel,
  name,
  description,
  pending,
  error,
  onNameChange,
  onDescriptionChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  name: string;
  description: string;
  pending: boolean;
  error: string | null;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={pending ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: (event: FormEvent) => {
            event.preventDefault();
            onSubmit();
          },
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="Name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            required
            fullWidth
            disabled={pending}
            slotProps={{ htmlInput: { maxLength: 120 } }}
            sx={fieldSx}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            fullWidth
            multiline
            minRows={3}
            disabled={pending}
            slotProps={{ htmlInput: { maxLength: 1000 } }}
            sx={fieldSx}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button type="button" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={pending || !name.trim()}
        >
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ListDetail({
  list,
  library,
  libraryLoading,
  libraryError,
  readOnly,
  onDelete,
}: {
  list: MediaList;
  library: MediaItem[];
  libraryLoading: boolean;
  libraryError: string | null;
  readOnly: boolean;
  onDelete: () => void;
}) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(list.name);
  const [draftDescription, setDraftDescription] = useState(list.description ?? '');
  const [metaError, setMetaError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [queryListId, setQueryListId] = useState(list.id);
  const [override, setOverride] = useState<MediaListItem[] | null>(null);
  const [overrideListId, setOverrideListId] = useState(list.id);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addItem, addState] = useAddMediaListItemMutation();
  const [removeItem, removeState] = useRemoveMediaListItemMutation();
  const [reorder, reorderState] = useReorderMediaListMutation();
  const [updateList, updateState] = useUpdateMediaListMutation();

  if (queryListId !== list.id) {
    setQueryListId(list.id);
    setQuery('');
    setActionError(null);
    setDragIndex(null);
    setOverIndex(null);
    setEditing(false);
    setDraftName(list.name);
    setDraftDescription(list.description ?? '');
    setMetaError(null);
  }
  if (override && overrideListId !== list.id) {
    setOverride(null);
  }

  const serverKey = list.items.map((item) => item.id).join(',');
  const overrideKey = override?.map((item) => item.id).join(',') ?? null;
  if (override && overrideKey === serverKey) {
    setOverride(null);
  }

  const freshById = new Map(list.items.map((item) => [item.id, item]));
  const items =
    override && overrideKey !== serverKey
      ? override.map((item) => freshById.get(item.id) ?? item)
      : list.items;

  const inList = new Set(list.items.map((item) => item.entry.id));
  const available = library.filter((item) => !inList.has(item.id));
  const busy = addState.isLoading || removeState.isLoading || reorderState.isLoading;

  const applyOrder = (next: MediaListItem[]) => {
    setOverrideListId(list.id);
    setOverride(next);
    setActionError(null);
    void reorder({ listId: list.id, itemIds: next.map((item) => item.id) })
      .unwrap()
      .catch((error: unknown) => {
        setOverride(null);
        setActionError(getApiErrorMessage(error, 'Failed to reorder the list'));
      });
  };

  const editingEnabled = editing && !readOnly;

  const startEditing = () => {
    setDraftName(list.name);
    setDraftDescription(list.description ?? '');
    setMetaError(null);
    setEditing(true);
  };

  const finishEditing = () => {
    const name = draftName.trim();
    const description = draftDescription.trim() || null;
    if (!name) {
      setMetaError('Give the list a name before leaving edit mode.');
      return;
    }
    const unchanged = name === list.name && description === (list.description ?? null);
    if (unchanged) {
      setMetaError(null);
      setEditing(false);
      return;
    }
    void updateList({ id: list.id, body: { name, description } })
      .unwrap()
      .then(() => {
        setMetaError(null);
        setEditing(false);
      })
      .catch((error: unknown) => {
        setMetaError(getApiErrorMessage(error, 'Failed to update the list'));
      });
  };

  const move = (from: number, to: number) => {
    if (!editingEnabled || busy) return;
    const next = moveItem(items, from, to);
    if (!next) return;
    applyOrder(next);
  };

  const add = (entryId: number) => {
    if (!editingEnabled || addState.isLoading) return;
    setActionError(null);
    void addItem({ listId: list.id, entryId })
      .unwrap()
      .then(() => setQuery(''))
      .catch((error: unknown) => {
        setActionError(getApiErrorMessage(error, 'Failed to add to the list'));
      });
  };

  const remove = (itemId: number) => {
    if (!editingEnabled || removeState.isLoading) return;
    setActionError(null);
    void removeItem({ listId: list.id, itemId })
      .unwrap()
      .catch((error: unknown) => {
        setActionError(getApiErrorMessage(error, 'Failed to remove from the list'));
      });
  };

  return (
    <Stack spacing={2.5}>
      {editingEnabled ? (
        <Stack spacing={1.5}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteOutlinedIcon />}
              onClick={onDelete}
              disabled={updateState.isLoading}
            >
              Delete
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<CheckIcon />}
              onClick={finishEditing}
              disabled={updateState.isLoading}
            >
              {updateState.isLoading ? 'Saving…' : 'Done'}
            </Button>
          </Box>
          <TextField
            label="Name"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            required
            fullWidth
            disabled={updateState.isLoading}
            slotProps={{ htmlInput: { maxLength: 120 } }}
            sx={fieldSx}
          />
          <TextField
            label="Description"
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            fullWidth
            multiline
            minRows={2}
            disabled={updateState.isLoading}
            slotProps={{ htmlInput: { maxLength: 1000 } }}
            sx={fieldSx}
          />
        </Stack>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {list.name}
            </Typography>
            {list.description && (
              <Typography
                color="text.secondary"
                sx={{ mt: 1.25, whiteSpace: 'pre-wrap', maxWidth: '68ch', lineHeight: 1.6 }}
              >
                {list.description}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
              {titleCount(items.length)}
            </Typography>
          </Box>
          {!readOnly && (
            <Button
              variant="outlined"
              startIcon={<EditOutlinedIcon />}
              onClick={startEditing}
              sx={{ flexShrink: 0 }}
            >
              Edit
            </Button>
          )}
        </Box>
      )}

      {editingEnabled && (
        <Autocomplete
          options={available}
          value={null}
          inputValue={query}
          onInputChange={(_event, value, reason) => {
            if (reason === 'reset') return;
            setQuery(value);
          }}
          onChange={(_event, item) => {
            if (item) add(item.id);
          }}
          getOptionKey={(item) => item.id}
          getOptionLabel={(item) => mediaDisplayTitle(item)}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          disabled={addState.isLoading}
          autoHighlight
          blurOnSelect
          clearOnBlur={false}
          noOptionsText={
            libraryLoading
              ? 'Loading your library…'
              : library.length === 0
                ? 'Your library is empty'
                : available.length === 0
                  ? 'Everything in your library is already in this list'
                  : 'No matching titles'
          }
          slotProps={{ listbox: { sx: { maxHeight: 320 } } }}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <Box
                component="li"
                key={key}
                {...optionProps}
                sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}
              >
                <Box
                  component="img"
                  src={option.poster_path || FALLBACK_POSTER}
                  alt=""
                  draggable={false}
                  sx={{
                    width: 32,
                    height: 48,
                    objectFit: 'cover',
                    borderRadius: 0.75,
                    flexShrink: 0,
                    backgroundColor: palette.paper,
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 600 }}>
                    {mediaDisplayTitle(option)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.media_type} · {option.status}
                  </Typography>
                </Box>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="Search your library to add"
              sx={fieldSx}
              slotProps={{
                ...params.slotProps,
                input: {
                  ...params.slotProps.input,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                      {params.slotProps.input.startAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />
      )}

      {metaError && <Alert severity="error">{metaError}</Alert>}
      {libraryError && editingEnabled && <Alert severity="error">{libraryError}</Alert>}
      {actionError && (
        <Alert severity="error" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {items.length === 0 && (
        <Typography color="text.secondary">
          {editingEnabled
            ? 'This list is empty. Search your library above to add something.'
            : 'This list is empty.'}
        </Typography>
      )}

      {items.length > 0 && editingEnabled && (
        <Stack spacing={1} role="list" aria-label={`${list.name} entries`}>
          {items.map((item, index) => {
            const title = mediaDisplayTitle(item.entry);
            const statusStyle = getStatusColor(item.entry.status);
            const dragging = dragIndex === index;
            const dropTarget = overIndex === index && dragIndex !== null && dragIndex !== index;
            return (
              <Box
                key={item.id}
                role="listitem"
                onClick={() => dispatch(openEditMediaModal(item.entry))}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  if (overIndex !== index) setOverIndex(index);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const from = dragIndex;
                  setDragIndex(null);
                  setOverIndex(null);
                  if (from == null) return;
                  move(from, index);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.25,
                  py: 1,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: `1px solid ${dropTarget ? palette.primary : palette.border}`,
                  backgroundColor: dragging ? palette.selectedBg : palette.surfaceElevated,
                }}
              >
                <Box
                  draggable={!busy}
                  aria-label={`Drag ${title}`}
                  onClick={(event) => event.stopPropagation()}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', String(index));
                    setDragIndex(index);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  sx={{
                    display: 'flex',
                    color: 'text.secondary',
                    cursor: busy ? 'default' : 'grab',
                    flexShrink: 0,
                  }}
                >
                  <DragIndicatorIcon fontSize="small" />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ width: 24, textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}
                >
                  {index + 1}
                </Typography>

                <Box
                  component="img"
                  src={item.entry.poster_path || FALLBACK_POSTER}
                  alt=""
                  draggable={false}
                  sx={{
                    width: 40,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 1,
                    flexShrink: 0,
                    backgroundColor: palette.paper,
                  }}
                />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 600 }}>
                    {title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {item.entry.media_type}
                      {' · '}
                      <Box component="span" sx={{ color: statusStyle.color }}>
                        {item.entry.status}
                      </Box>
                    </Typography>
                    {item.entry.rating != null && (
                      <StarRating value={item.entry.rating} readOnly size="small" />
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexShrink: 0 }} onClick={(event) => event.stopPropagation()}>
                  <IconButton
                    size="small"
                    aria-label={`Move ${title} up`}
                    disabled={busy || index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <KeyboardArrowUpIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Move ${title} down`}
                    disabled={busy || index === items.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <KeyboardArrowDownIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Remove ${title}`}
                    disabled={removeState.isLoading}
                    onClick={() => remove(item.id)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}

      {items.length > 0 && !editingEnabled && (
        <Grid container spacing={2}>
          {items.map((item, index) => (
            <Grid key={item.id} size={VIEW_COLS}>
              <Box sx={{ position: 'relative' }}>
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    zIndex: 2,
                    minWidth: 36,
                    height: 36,
                    px: 1,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.82)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
                    pointerEvents: 'none',
                  }}
                >
                  {index + 1}
                </Box>
                <MediaCard
                  item={item.entry}
                  onClick={() => dispatch(openEditMediaModal(item.entry))}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}

// Lists page: create named collections and order library entries inside them.
export function ListsPage() {
  const username = useAppSelector((state) => state.auth.username);
  const viewingAs = useAppSelector((state) => state.auth.viewingAs);
  const readOnly = Boolean(viewingAs);

  const {
    data: lists = [],
    isLoading,
    isError,
    error,
  } = useGetMediaListsQuery(undefined, { skip: !username });
  const entriesQuery = useGetMediaEntriesQuery(undefined, { skip: !username || readOnly });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createdList, setCreatedList] = useState<MediaList | null>(null);
  const [formMode, setFormMode] = useState<'create' | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [createList, createState] = useCreateMediaListMutation();
  const [deleteList, deleteState] = useDeleteMediaListMutation();

  const visibleLists =
    createdList && !lists.some((list) => list.id === createdList.id)
      ? [...lists, createdList]
      : lists;
  const selected =
    visibleLists.find((list) => list.id === selectedId) ??
    (selectedId == null ? visibleLists[0] ?? null : null);
  const saving = createState.isLoading;
  const libraryError = entriesQuery.isError
    ? getApiErrorMessage(entriesQuery.error, 'Failed to load your library')
    : null;

  const openCreate = () => {
    setFormName('');
    setFormDescription('');
    setFormError(null);
    setFormMode('create');
  };

  const saveForm = () => {
    const body = {
      name: formName.trim(),
      description: formDescription.trim() || null,
    };
    if (!body.name || saving) return;
    setFormError(null);

    if (formMode === 'create') {
      void createList(body)
        .unwrap()
        .then((created) => {
          setCreatedList(created);
          setSelectedId(created.id);
          setFormMode(null);
        })
        .catch((saveError: unknown) => {
          setFormError(getApiErrorMessage(saveError, 'Failed to create the list'));
        });
    }
  };

  const confirmDelete = () => {
    if (!selected || deleteState.isLoading) return;
    const removedId = selected.id;
    void deleteList(removedId)
      .unwrap()
      .then(() => {
        setDeleteOpen(false);
        setSelectedId((current) => (current === removedId ? null : current));
      })
      .catch(() => {
        setDeleteOpen(false);
      });
  };

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: palette.primary }}>
          Lists
        </Typography>
        {!readOnly && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New list
          </Button>
        )}
      </Box>

      {isError && (
        <Alert severity="error">{getApiErrorMessage(error, 'Failed to load lists')}</Alert>
      )}

      {deleteState.isError && (
        <Alert severity="error">
          {getApiErrorMessage(deleteState.error, 'Failed to delete the list')}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && !isError && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2.5,
            alignItems: 'stretch',
          }}
        >
          <Box
            sx={{
              width: { xs: '100%', md: 280 },
              flexShrink: 0,
              border: `1px solid ${palette.border}`,
              borderRadius: 2,
              backgroundColor: palette.surface,
              p: 1.25,
              alignSelf: 'flex-start',
            }}
          >
            {visibleLists.length === 0 && (
              <Typography color="text.secondary" sx={{ px: 1, py: 1.5 }}>
                {readOnly
                  ? 'No lists yet.'
                  : 'No lists yet. Create one, then add media from your library.'}
              </Typography>
            )}
            <Stack spacing={0.5}>
              {visibleLists.map((list) => {
                const active = selected?.id === list.id;
                return (
                  <Button
                    key={list.id}
                    onClick={() => setSelectedId(list.id)}
                    aria-current={active ? 'true' : undefined}
                    sx={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      textTransform: 'none',
                      px: 1.5,
                      py: 1,
                      borderRadius: 1.5,
                      color: active ? palette.primary : 'text.primary',
                      backgroundColor: active ? palette.selectedBg : 'transparent',
                      border: `1px solid ${active ? palette.primary : 'transparent'}`,
                    }}
                  >
                    <Box sx={{ minWidth: 0, width: '100%' }}>
                      <Typography noWrap sx={{ fontWeight: 600 }}>
                        {list.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {titleCount(list.items.length)}
                      </Typography>
                    </Box>
                  </Button>
                );
              })}
            </Stack>
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              border: `1px solid ${palette.border}`,
              borderRadius: 2,
              backgroundColor: palette.surface,
              p: { xs: 2, sm: 2.5 },
            }}
          >
            {selected ? (
              <ListDetail
                list={selected}
                library={entriesQuery.data ?? []}
                libraryLoading={entriesQuery.isLoading}
                libraryError={libraryError}
                readOnly={readOnly}
                onDelete={() => setDeleteOpen(true)}
              />
            ) : (
              <Typography color="text.secondary">
                {selectedId == null
                  ? 'Create a list to start collecting media.'
                  : 'Loading list…'}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      <ListFormDialog
        open={formMode !== null}
        title="New list"
        submitLabel="Create"
        name={formName}
        description={formDescription}
        pending={saving}
        error={formError}
        onNameChange={setFormName}
        onDescriptionChange={setFormDescription}
        onClose={() => setFormMode(null)}
        onSubmit={saveForm}
      />

      <Dialog open={deleteOpen} onClose={deleteState.isLoading ? undefined : () => setDeleteOpen(false)}>
        <DialogTitle>Delete list</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selected
              ? `Delete "${selected.name}"? The media stays in your library.`
              : 'Delete this list?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleteState.isLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={deleteState.isLoading}
          >
            {deleteState.isLoading ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
