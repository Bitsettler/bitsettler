"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PencilRuler } from "@phosphor-icons/react";
import { Container } from "@/components/container";
import { MainNav } from "@/components/main-nav";
import { MobileNav } from "@/components/mobile-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { Search } from "@/components/search";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/src/i18n/navigation";

export function Header() {
  const t = useTranslations();

  return (
    <header className="bg-background sticky top-0 z-50 w-full">
      <Container className="flex h-14 items-center gap-2">
        <MobileNav className="flex lg:hidden" />
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="hidden size-8 lg:flex"
        >
          <Link href="/">
            <PencilRuler className="size-5" />
            <span className="sr-only">{t("header.title")}</span>
          </Link>
        </Button>
        <MainNav className="hidden lg:flex" />
        <div className="ml-auto flex items-center md:flex-1 md:justify-end gap-2">
          <div className="hidden w-full flex-1 md:flex md:w-auto md:flex-none">
            <Search />
          </div>
          <Separator orientation="vertical" className="h-6 block" />
          <ModeToggle />
        </div>
      </Container>
    </header>
  );
}
