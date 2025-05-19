import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme-provider";
import { Sun, Moon, UserCircle } from "lucide-react";

export default function NavBar() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="bg-background dark:bg-slate-800 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Link href="/" className="text-primary-600 dark:text-primary-400 font-bold text-xl">منصة الاختبارات</Link>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            {theme === "dark" ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5" />}
          </Button>
          <div className="relative">
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-foreground">
              <span>حسابي</span>
              <UserCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
