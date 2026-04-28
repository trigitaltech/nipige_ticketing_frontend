import { getAvatarColor, getInitials } from '../../utils/avatar';

const UserAvatar = ({ name, size = 22 }) => (
  <span
    className="shrink-0 rounded-full flex items-center justify-center text-white font-semibold"
    style={{ width: size, height: size, fontSize: size * 0.4, background: getAvatarColor(name) }}
  >
    {getInitials(name)}
  </span>
);

export default UserAvatar;
