'use client';

import { ChangeEvent, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { palette } from '@/lib/palette';
import { useGetUserSettingsQuery, useUploadAvatarMutation } from '@/redux/api/mediaApi';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

interface AvatarProps {
  username: string | null;
}

/** Large avatar with hover pencil and server-backed file upload.
 *
 * @param props.username - Current user; skips settings fetch when null.
 * @returns Clickable square avatar matching the chart height.
 */
export function Avatar({ username }: AvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: settings } = useGetUserSettingsQuery(undefined, {
    skip: !username,
  });
  const [uploadAvatar, uploadState] = useUploadAvatarMutation();

  // Full public S3 / R2 URL from the API (e.g. https://pub-….r2.dev/avatars/…)
  const imageSrc = settings?.avatar_path ?? null;

  /** Opens the native file picker.
   */
  const openPicker = () => {
    if (uploadState.isLoading) return;
    inputRef.current?.click();
  };

  /** Uploads the selected image to the backend.
   *
   * @param event - Change event from the hidden file input.
   */
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !username) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > MAX_IMAGE_BYTES) return;
    void uploadAvatar(file);
  };

  return (
    <Box
      component="button"
      type="button"
      onClick={openPicker}
      disabled={uploadState.isLoading}
      aria-label="Change avatar"
      sx={{
        position: 'relative',
        p: 0,
        border: 'none',
        background: 'none',
        cursor: uploadState.isLoading ? 'wait' : 'pointer',
        borderRadius: 2,
        lineHeight: 0,
        '&:hover .avatar-overlay, &:focus-visible .avatar-overlay': {
          opacity: uploadState.isLoading ? 0 : 1,
        },
        '&:focus-visible': {
          outline: `2px solid ${palette.primary}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box
        sx={{
          width: 160,
          height: 160,
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: palette.surfaceElevated,
          border: `1px solid ${palette.border}`,
        }}
      >
        {imageSrc ? (
          <Box
            component="img"
            src={imageSrc}
            alt={username ? `${username} avatar` : 'Avatar'}
            draggable={false}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : null}
      </Box>

      <Box
        className="avatar-overlay"
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          opacity: 0,
          transition: 'opacity 0.15s ease',
          color: palette.textOnDark,
        }}
      >
        <EditOutlinedIcon sx={{ fontSize: 36 }} />
      </Box>

      {uploadState.isLoading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
          }}
        >
          <CircularProgress size={32} thickness={5} sx={{ color: palette.primary }} />
        </Box>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        hidden
      />
    </Box>
  );
}
