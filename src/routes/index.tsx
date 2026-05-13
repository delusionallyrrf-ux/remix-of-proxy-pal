import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "This site can't be reached" }],
  }),
  component: Index,
});

function Index() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
        color: "#202124",
        fontFamily: "Arial, sans-serif",
        padding: "1.5rem",
      }}
    >
      <div style={{ maxWidth: "32rem", width: "100%" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 400, margin: "0 0 1rem" }}>
          This site can't be reached
        </h1>
        <p style={{ color: "#5f6368", margin: "0 0 1.5rem", lineHeight: 1.5 }}>
          The webpage at this address might be temporarily down or it may have moved permanently to a new web address.
        </p>
        <p style={{ color: "#5f6368", fontSize: "0.875rem", margin: 0 }}>
          ERR_NAME_NOT_RESOLVED
        </p>
      </div>
    </div>
  );
}
