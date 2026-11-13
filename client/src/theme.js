export const colors = {
  bg: '#F3F5F8',
  card: '#FFFFFF',
  ink: '#122033',
  muted: '#5B6B7C',
  line: '#E4E9F0',
  primary: '#1F6F8B',
  primaryDark: '#155569',
  accent: '#E8F4F8',
  success: '#1B7F5A',
  successBg: '#E5F6EE',
  warning: '#B26A00',
  warningBg: '#FFF3DC',
  done: '#5B6B7C',
  doneBg: '#EEF1F5',
  danger: '#C0392B',
};

export function statusKey(status) {
  if (
    status === 'assigned' ||
    status === 'completed' ||
    status === 'cancelled'
  ) {
    return status;
  }
  return 'new';
}

export const statusMeta = status => {
  if (status === 'assigned') {
    return {color: colors.success, bg: colors.successBg};
  }
  if (status === 'completed') {
    return {color: colors.done, bg: colors.doneBg};
  }
  if (status === 'cancelled') {
    return {color: colors.danger, bg: '#FDECEA'};
  }
  return {color: colors.warning, bg: colors.warningBg};
};
