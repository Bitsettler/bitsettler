"use client";

import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t("header.title")}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t("header.subtitle")}
          </p>
        </div>

        {/* We'll build the content here together */}
      </main>
    </div>
  );
}
