import Link from "next/link";
import { ClubAvatar } from "@/components/club-avatar";
import { ArrowRight } from "lucide-react";

interface ClubCardProps {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}

export function ClubCard({ id, name, description, imageUrl }: ClubCardProps) {
  return (
    <Link href={`/clubs/${id}`} className="group block">
      <article className="relative h-full overflow-hidden rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-300 hover-lift hover:border-primary/30 hover:shadow-honey">
        {/* Decorative corner accent */}
        <div className="absolute -right-8 -top-8 h-16 w-16 rounded-full bg-primary/5 transition-transform duration-300 group-hover:scale-150" />
        
        <div className="relative flex gap-4">
          {/* Avatar */}
          <div className="shrink-0">
            <ClubAvatar 
              name={name} 
              imageUrl={imageUrl} 
              size="md" 
              className="ring-2 ring-background shadow-md transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          
          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 
                className="truncate text-lg font-semibold tracking-tight transition-colors group-hover:text-primary"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {name}
              </h3>
              
              {/* Arrow indicator */}
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/50 opacity-0 transition-all duration-300 group-hover:bg-primary/10 group-hover:opacity-100">
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            
            {description && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
            
            {/* Join prompt */}
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 transition-all duration-300 group-hover:opacity-100">
              <span>View club</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
