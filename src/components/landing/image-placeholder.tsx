import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ImagePlaceholderProps = {
  label?: string;
  aspect?: "video" | "square" | "portrait" | "wide" | "hero";
  className?: string;
  rounded?: "lg" | "xl" | "2xl" | "3xl";
};

const aspectMap = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  wide: "aspect-[16/10]",
  hero: "aspect-[4/3] min-h-[280px] md:min-h-[360px]",
};

const roundedMap = {
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  "2xl": "rounded-[24px]",
  "3xl": "rounded-[28px]",
};

/** Empty slot for assets you will add later — no faux UI built in HTML. */
export function ImagePlaceholder({
  label = "Image placeholder",
  aspect = "wide",
  className,
  rounded = "3xl",
}: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border border-dashed border-[rgba(17,17,17,0.12)] bg-[#ECEEE8]",
        aspectMap[aspect],
        roundedMap[rounded],
        className
      )}
      aria-label={label}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="h-12 w-12 rounded-2xl bg-white/80 flex items-center justify-center border border-border">
          <ImageIcon className="h-5 w-5 text-muted" strokeWidth={1.5} />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted max-w-[200px]">
          {label}
        </p>
      </div>
    </div>
  );
}
