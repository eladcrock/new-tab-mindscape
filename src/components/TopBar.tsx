import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Eye, Target, History as HistoryIcon, LogOut, MessageCircle } from "lucide-react";

type Props = {
  textColor?: string;
  transparent?: boolean;
};

export function TopBar({ textColor, transparent }: Props) {
  const { user, signOut } = useAuth();
  const style = textColor ? { color: textColor } : undefined;

  const linkBase =
    "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium opacity-80 hover:opacity-100 transition-opacity";

  return (
    <header
      className={`relative z-10 flex items-center justify-between px-5 py-4 ${transparent ? "" : "border-b border-border bg-background"}`}
      style={style}
    >
      <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight" style={style}>
        <Eye className="h-5 w-5" />
        <span>Focal Lens</span>
      </Link>
      <nav className="flex items-center gap-1">
        <Link to="/goals" className={linkBase} style={style}>
          <Target className="h-4 w-4" /> <span>Goals</span>
        </Link>
        <Link to="/lenses" className={linkBase} style={style}>
          <Eye className="h-4 w-4" /> <span>Lenses</span>
        </Link>
        <Link to="/chat" className={linkBase} style={style}>
          <MessageCircle className="h-4 w-4" /> <span>Chat</span>
        </Link>
        <Link to="/history" className={linkBase} style={style}>
          <HistoryIcon className="h-4 w-4" /> <span>History</span>
        </Link>
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="ml-1"
            style={style}
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-1.5">Sign out</span>
          </Button>
        )}
      </nav>
    </header>
  );
}
