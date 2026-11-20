import Link from "next/link";
import { Camera, Globe, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/config";

const EXPLORE_LINKS = [
  { href: "/services", label: "Browse Services" },
  { href: "/services?category=Wedding%20Venues", label: "Wedding Venues" },
  { href: "/services?category=Photography%20%26%20Videography", label: "Photography" },
  { href: "/services?category=Catering%20Services", label: "Catering" },
];

const ACCOUNT_LINKS = [
  { href: "/signin", label: "Sign In" },
  { href: "/signup", label: "Create an account" },
  { href: "/signup?role=vendor", label: "Become a vendor" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-secondary/30">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo size={34} />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {SITE_DESCRIPTION}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${SITE_NAME} on Facebook`}
                render={
                  <a href="https://facebook.com" target="_blank" rel="noreferrer noopener" />
                }
              >
                <Globe className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${SITE_NAME} on Instagram`}
                render={
                  <a href="https://instagram.com" target="_blank" rel="noreferrer noopener" />
                }
              >
                <Camera className="size-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase">Explore</h3>
            <ul className="mt-4 space-y-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase">Account</h3>
            <ul className="mt-4 space-y-2.5">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-primary" aria-hidden />
                <a href="tel:+8801700000000" className="hover:text-foreground">
                  +880 1700 000 000
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-primary" aria-hidden />
                <a href="mailto:hello@wedmera.app" className="hover:text-foreground">
                  hello@wedmera.app
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {year} {SITE_NAME}. All rights reserved.
          </p>
          <p>Made for couples planning their perfect day in Bangladesh.</p>
        </div>
      </div>
    </footer>
  );
}
