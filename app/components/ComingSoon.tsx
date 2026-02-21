import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  accentColor?: string;
}

export default function ComingSoon({
  icon: Icon,
  title,
  description,
  accentColor = "#6366f1",
}: Props) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        gap: "1.5rem",
        minHeight: 0,
      }}
    >
      {/* Icon ring */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: `${accentColor}18`,
          border: `2px solid ${accentColor}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={42} color={accentColor} strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            marginBottom: "0.6rem",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {description ?? "This section is coming soon. Check back later!"}
        </p>
      </div>

      {/* Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.4rem 1rem",
          borderRadius: 20,
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}44`,
          color: accentColor,
          fontSize: "0.8rem",
          fontWeight: 600,
          letterSpacing: "0.03em",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: accentColor,
            display: "inline-block",
          }}
        />
        Coming Soon
      </div>
    </div>
  );
}
