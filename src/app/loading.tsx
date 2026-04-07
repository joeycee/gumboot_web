import Image from "next/image";

export default function Loading() {
  return (
    <div className="gb-loading-overlay" aria-live="polite" aria-busy="true">
      <div className="gb-loading-inner">
        <Image
          className="gb-loading-logo"
          src="/logo.png"
          alt="Gumboot loading"
          width={72}
          height={72}
          priority
        />
        <div className="gb-loading-text">Loading</div>
      </div>
    </div>
  );
}
