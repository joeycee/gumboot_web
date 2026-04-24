import { ImageResponse } from "next/og";
import { fetchJobShareData } from "@/lib/jobShare";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 0,
        padding: "18px 20px",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          fontSize: 16,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "rgba(234,234,234,0.58)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          lineHeight: 1.2,
          color: "#F5F7FA",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default async function OpengraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const share = await fetchJobShareData(id);

  const title = share?.title || "Gumboot Job";
  const description = share?.description || "Book trusted local help in minutes.";
  const facts = [
    { label: "Type", value: share?.jobTypeName || "Local help" },
    { label: "Location", value: share?.location || "View listing for details" },
    { label: "Budget", value: share?.priceLabel || "Ask for quote" },
  ];

  if (share?.dateLabel) {
    facts.push({ label: "Date", value: share.dateLabel });
  } else if (share?.posterName) {
    facts.push({ label: "Posted by", value: share.posterName });
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: 28,
          background: "#0F151C",
          color: "#F5F7FA",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top left, rgba(32,151,189,0.33), transparent 36%), radial-gradient(circle at bottom right, rgba(20,184,166,0.18), transparent 30%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            borderRadius: 28,
            padding: 40,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(180deg, rgba(22,30,38,0.92), rgba(12,18,24,0.96))",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: 28,
                color: "rgba(245,247,250,0.92)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: "#2097BD",
                  boxShadow: "0 0 24px rgba(32,151,189,0.6)",
                }}
              />
              Gumboot
            </div>
            <div
              style={{
                display: "flex",
                padding: "12px 18px",
                borderRadius: 999,
                background: "rgba(32,151,189,0.16)",
                border: "1px solid rgba(32,151,189,0.36)",
                fontSize: 20,
                color: "#93D8EA",
              }}
            >
              Job Preview
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 68,
                lineHeight: 1.06,
                fontWeight: 700,
                maxWidth: 960,
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                lineHeight: 1.35,
                color: "rgba(245,247,250,0.72)",
                maxWidth: 980,
              }}
            >
              {description}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              width: "100%",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {facts.map((fact) => (
              <InfoPill key={`${fact.label}-${fact.value}`} label={fact.label} value={fact.value} />
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
