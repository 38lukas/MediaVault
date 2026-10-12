'use client';

import { FormEvent, useEffect, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { SectionDivider } from '@/components/common/SectionDivider';
import { palette } from '@/lib/palette';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { enterFriendView } from '@/redux/slices/authSlice';
import {
  mediaApi,
  useAddFriendMutation,
  useGetFriendsQuery,
  useRemoveFriendMutation,
} from '@/redux/api/mediaApi';
import { getApiErrorMessage } from '@/utils/apiError';

export default function FriendsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const username = useAppSelector((state) => state.auth.username);
  const viewingAs = useAppSelector((state) => state.auth.viewingAs);

  const [name, setName] = useState('');
  const { data: friends, isLoading, isError, error } = useGetFriendsQuery(undefined, {
    skip: !username || Boolean(viewingAs),
  });
  const [addFriend, addState] = useAddFriendMutation();
  const [removeFriend, removeState] = useRemoveFriendMutation();

  useEffect(() => {
    if (viewingAs) {
      router.replace('/');
    }
  }, [viewingAs, router]);

  const listError = getApiErrorMessage(error, 'Failed to load friends');
  const addError = addState.isError
    ? getApiErrorMessage(addState.error, 'Failed to add friend')
    : null;

  if (viewingAs) return null;

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || addState.isLoading) return;
    try {
      await addFriend(trimmed).unwrap();
      setName('');
      addState.reset();
    } catch {
    }
  };

  const handleViewFriend = (friendUsername: string) => {
    dispatch(enterFriendView(friendUsername));
    dispatch(mediaApi.util.resetApiState());
    router.push('/');
  };

  const handleRemove = async (
    friendUsername: string,
    event: MouseEvent
  ) => {
    event.stopPropagation();
    try {
      await removeFriend(friendUsername).unwrap();
    } catch {
    }
  };

  return (
    <>
      <SectionDivider label="Friends" />

      <Box
        component="form"
        onSubmit={handleAdd}
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          mb: 3,
        }}
      >
        <TextField
          label="Username"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (addState.isError) addState.reset();
          }}
          size="small"
          autoComplete="off"
          disabled={addState.isLoading}
          sx={{ minWidth: 220, flex: '1 1 200px' }}
        />
        <Button
          type="submit"
          variant="contained"
          startIcon={<PersonAddOutlinedIcon />}
          disabled={addState.isLoading || !name.trim()}
          sx={{ whiteSpace: 'nowrap', height: 40 }}
        >
          {addState.isLoading ? 'Adding…' : 'Add friend'}
        </Button>
      </Box>

      {addError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => addState.reset()}>
          {addError}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {listError}
        </Alert>
      )}

      {friends && friends.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          No friends yet. Add someone by their username to follow their library.
        </Typography>
      )}

      {friends && friends.length > 0 && (
        <List
          disablePadding
          sx={{
            border: `1px solid ${palette.border}`,
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: palette.surface,
          }}
        >
          {friends.map((friend, index) => (
            <ListItem
              key={friend.username}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label={`Remove ${friend.username}`}
                  onClick={(e) => void handleRemove(friend.username, e)}
                  disabled={removeState.isLoading}
                  size="small"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
              sx={{
                borderBottom:
                  index < friends.length - 1
                    ? `1px solid ${palette.borderSubtle}`
                    : 'none',
              }}
            >
              <ListItemButton
                onClick={() => handleViewFriend(friend.username)}
                sx={{ pr: 7 }}
              >
                <ListItemAvatar sx={{ minWidth: 48 }}>
                  {friend.avatar_path ? (
                    <Box
                      component="img"
                      src={friend.avatar_path}
                      alt=""
                      draggable={false}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: palette.surfaceElevated,
                        border: `1px solid ${palette.border}`,
                        color: palette.primary,
                      }}
                    >
                      <PersonOutlinedIcon fontSize="small" />
                    </Box>
                  )}
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography sx={{ fontWeight: 600 }}>{friend.username}</Typography>
                  }
                  secondary="View library"
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}

      {removeState.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {getApiErrorMessage(removeState.error, 'Failed to remove friend')}
        </Alert>
      )}
    </>
  );
}
