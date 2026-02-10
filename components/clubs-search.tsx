"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ClubCard } from "@/components/club-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClubSummary = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
};

interface ClubsSearchProps {
  clubs: ClubSummary[];
  initialQuery?: string;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function ClubsSearch({ clubs, initialQuery = "" }: ClubsSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const normalizedQuery = normalize(query);

  const filteredClubs = useMemo(() => {
    if (!normalizedQuery) {
      return clubs;
    }

    return clubs.filter((club) => {
      const name = normalize(club.name);
      const description = club.description ? normalize(club.description) : "";
      return name.includes(normalizedQuery) || description.includes(normalizedQuery);
    });
  }, [clubs, normalizedQuery]);

  const resultLabel = normalizedQuery
    ? `${filteredClubs.length} ${
        filteredClubs.length === 1 ? "clube encontrado" : "clubes encontrados"
      }`
    : `${clubs.length} ${clubs.length === 1 ? "clube" : "clubes"} disponíveis`;

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-muted-foreground">{resultLabel}</p>

        <div className="relative w-full sm:max-w-sm">
          <label htmlFor="club-search" className="sr-only">
            Buscar clubes
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="club-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar clubes"
            className="h-11 bg-card/60 pl-9 pr-10"
            autoComplete="off"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {filteredClubs.length === 0 ? (
        <section className="relative overflow-hidden rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <div className="absolute inset-0 pattern-honeycomb opacity-25" />
          <div className="relative space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Nenhum clube encontrado
            </h2>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Tente outra busca ou limpe o filtro para ver todos os clubes.
            </p>
            <Button variant="outline" onClick={() => setQuery("")}>
              Limpar busca
            </Button>
          </div>
        </section>
      ) : (
        <div className="stagger-in grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClubs.map((club) => (
            <ClubCard
              key={club.id}
              id={club.id}
              name={club.name}
              description={club.description}
              imageUrl={club.imageUrl}
            />
          ))}
        </div>
      )}
    </section>
  );
}
