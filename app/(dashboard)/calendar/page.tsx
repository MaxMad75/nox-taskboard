import CalendarWeekView from "../../CalendarWeekView";

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
      <CalendarWeekView />
    </div>
  );
}
