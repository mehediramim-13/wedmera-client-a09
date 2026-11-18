import Link from "next/link";
import { AtSign, Mail } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Separator } from "@/components/ui/separator";
import { SITE_NAME } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            A thoughtful place to find trusted wedding professionals and bring
            every detail of your celebration together.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Explore</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            <Link className="hover:text-foreground" href="/">
              Home
            </Link>
            <Link className="hover:text-foreground" href="/services">
              Browse services
            </Link>
            <Link className="hover:text-foreground" href="/signup">
              Join as a vendor
            </Link>
          </div>
        </div>
        <div>
          <h2 className="font-semibold">Get in touch</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            <a
              className="inline-flex items-center gap-2 hover:text-foreground"
              href="mailto:hello@wedmera.com"
            >
              <Mail className="size-4" />
              hello@wedmera.com
            </a>
            <a
              aria-label="Instagram"
              className="inline-flex items-center gap-2 hover:text-foreground"
              href="https://www.instagram.com/"
              rel="noreferrer"
              target="_blank"
            >
              <AtSign className="size-4" />
              Instagram
            </a>
          </div>
        </div>
      </div>
      <Separator />
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} {SITE_NAME}. Made for your forever.</p>
        <p>Thoughtful planning, beautiful beginnings.</p>
      </div>
    </footer>
  );
}
