import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#111411] overflow-hidden">
      {/* Screenshot backdrops at corners */}
      <div className="absolute top-6 left-20 w-[400px] h-[850px] opacity-[0.18] pointer-events-none rounded-xl overflow-hidden rotate-[-3deg]">
        <Image
          src="/screenshots/listing.png"
          alt=""
          fill
          className="object-cover object-top"
          unoptimized
        />
      </div>
      <div className="absolute top-6 right-76 w-[480px] h-[560px] opacity-[0.18] pointer-events-none rounded-xl overflow-hidden rotate-[2deg]">
        <Image
          src="/screenshots/dashboard.png"
          alt=""
          fill
          className="object-cover object-left-top"
          unoptimized
        />
      </div>
      <div className="absolute bottom-10 right-10 w-[340px] h-[240px] opacity-[1.18] pointer-events-none rounded-xl overflow-hidden rotate-[-1deg]">
        <Image
          src="/screenshots/map.png"
          alt=""
          fill
          className="object-cover object-center"
          unoptimized
        />
      </div>
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#111411]/90 backdrop-blur-sm border-white/[0.03]" />
      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  );
}
