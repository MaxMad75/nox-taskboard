import CalendarView from "../../CalendarView";

export default function CalendarPage() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 2rem",
        overflow: "auto",
        minWidth: 0,
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Calendar
      </h1>
      <CalendarView />
    </div>
  );
}
