"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MapPin } from "lucide-react";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

let initialized = false;

function ensureInitialized(apiKey: string) {
  if (!initialized) {
    setOptions({ key: apiKey });
    initialized = true;
  }
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  apiKey: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  apiKey,
}: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(
    null,
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ensureInitialized(apiKey);
    importLibrary("places").then(() => {
      serviceRef.current = new google.maps.places.AutocompleteService();
    });
  }, [apiKey]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const fetchPredictions = useCallback((input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!input.trim()) {
      setPredictions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (!serviceRef.current) return;

      try {
        const response = await serviceRef.current.getPlacePredictions({
          input,
        });
        setPredictions(response.predictions);
        setOpen(response.predictions.length > 0);
      } catch {
        setPredictions([]);
        setOpen(false);
      }
    }, 300);
  }, []);

  function handleInputChange(val: string) {
    setQuery(val);
    fetchPredictions(val);
  }

  function handleSelect(description: string) {
    setQuery(description);
    onChange(description);
    setPredictions([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Command shouldFilter={false} className="overflow-visible bg-transparent">
        <CommandInput
          value={query}
          onValueChange={handleInputChange}
          placeholder="Buscar endereço..."
          onBlur={() => {
            setTimeout(() => setOpen(false), 200);
          }}
          onFocus={() => {
            if (predictions.length > 0) setOpen(true);
          }}
          className="h-9"
        />
        {open && predictions.length > 0 && (
          <CommandList className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
            <CommandGroup>
              {predictions.map((prediction) => (
                <CommandItem
                  key={prediction.place_id}
                  value={prediction.place_id}
                  onSelect={() => handleSelect(prediction.description)}
                >
                  <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <span className="truncate">{prediction.description}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        )}
      </Command>
    </div>
  );
}
