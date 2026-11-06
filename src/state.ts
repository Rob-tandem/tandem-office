export type Status = 'available' | 'meeting' | 'away';
export interface Peer {
  id: string; name: string; color: string;
  x: number; y: number; status: Status; muted: boolean; transcribing: boolean;
  // interpolation targets for remote peers
  tx?: number; ty?: number;
}
export const COLORS = ['#404A87', '#E5795E', '#63C6AC', '#74B3E4', '#F3A7C3', '#F6BB47', '#9BA0D9', '#0D8F84', '#B83A57', '#C8951A'];
