import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

interface TeamAvatarProps {
  name: string;
  logo?: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}

/** A team's logo, falling back to the team's initials. */
export default function TeamAvatar({
  name,
  logo,
  size = "default",
  className,
}: TeamAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      {logo ? <AvatarImage src={logo} alt="" /> : null}
      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 font-semibold text-white">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
