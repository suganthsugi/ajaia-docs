import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { UserMenu } from "@/components/UserMenu";

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <Link href="/" className="font-semibold">
        Ajaia Docs
      </Link>
      {user && <UserMenu user={user} />}
    </header>
  );
}
