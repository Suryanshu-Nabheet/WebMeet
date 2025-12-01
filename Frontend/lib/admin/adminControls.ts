import { getSocket } from "@/lib/socket";
import { toast } from "@/components/ui/toast";

export interface AdminAction {
  type: 'mute-all' | 'unmute-all' | 'disable-all-cameras' | 'enable-all-cameras' | 'lock-meeting' | 'unlock-meeting' | 'end-meeting' | 'admit-participant' | 'reject-participant';
  targetUserId?: string;
  data?: any;
}

/**
 * Mute all participants in the meeting
 */
export const muteAllParticipants = () => {
  const socket = getSocket();
  socket.emit('admin-action', { type: 'mute-all' });
  toast.success('Muted all participants');
};

/**
 * Unmute all participants in the meeting
 */
export const unmuteAllParticipants = () => {
  const socket = getSocket();
  socket.emit('admin-action', { type: 'unmute-all' });
  toast.success('Unmuted all participants');
};

/**
 * Disable all participant cameras
 */
export const disableAllCameras = () => {
  const socket = getSocket();
  socket.emit('admin-action', { type: 'disable-all-cameras' });
  toast.success('Disabled all cameras');
};

/**
 * Enable all participant cameras
 */
export const enableAllCameras = () => {
  const socket = getSocket();
  socket.emit('admin-action', { type: 'enable-all-cameras' });
  toast.success('Enabled all cameras');
};

/**
 * Lock the meeting - new participants go to waiting room
 */
export const lockMeeting = () => {
  const socket = getSocket();
  socket.emit('admin-action', { type: 'lock-meeting' });
  toast.success('Meeting locked - new participants will wait for approval');
};

/**
 * Unlock the meeting - participants can join directly
 */
export const unlockMeeting = () => {
  const socket = getSocket();
  socket.emit('admin-action', { type: 'unlock-meeting' });
  toast.success('Meeting unlocked');
};

/**
 * End the meeting for all participants
 */
export const endMeetingForAll = () => {
  const socket = getSocket();
  socket.emit('admin-action', { type: 'end-meeting' });
  toast.info('Ending meeting for all participants...');
};

/**
 * Admit a participant from waiting room
 */
export const admitParticipant = (userId: string, username: string) => {
  const socket = getSocket();
  socket.emit('admin-action', { type: 'admit-participant', targetUserId: userId });
  toast.success(`Admitted ${username} to the meeting`);
};

/**
 * Reject a participant from waiting room
 */
export const rejectParticipant = (userId: string, username: string) => {
  const socket = getSocket();
  socket.emit('admin-action', { type: 'reject-participant', targetUserId: userId });
  toast.info(`Rejected ${username}'s request to join`);
};

/**
 * Mute a specific participant
 */
export const muteParticipant = (userId: string, username: string) => {
  const socket = getSocket();
  socket.emit('admin-action', { type: 'mute-participant', targetUserId: userId });
  toast.success(`Muted ${username}`);
};

/**
 * Disable a specific participant's camera
 */
export const disableParticipantCamera = (userId: string, username: string) => {
  const socket = getSocket();
  socket.emit('admin-action', { type: 'disable-participant-camera', targetUserId: userId });
  toast.success(`Disabled ${username}'s camera`);
};

/**
 * Remove a participant from the meeting
 */
export const removeParticipant = (userId: string, username: string) => {
  const socket = getSocket();
  socket.emit('remove-participant', userId);
  toast.info(`Removing ${username} from the meeting...`);
};
