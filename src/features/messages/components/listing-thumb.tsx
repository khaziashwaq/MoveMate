import { Package } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/shared/utils/cn";

/** Square listing image with a placeholder for deleted/imageless listings. */
export function ListingThumb({
  src,
  className,
}: {
  src?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[10px] overflow-hidden shrink-0 border border-white/5 bg-[#1c1c1c] flex items-center justify-center",
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <Package size={18} className="text-[#8D8D8D]" />
      )}
    </div>
  );
}
