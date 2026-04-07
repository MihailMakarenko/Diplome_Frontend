import React from "react";
import "./ErrorBanner.css";

export default function ErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div className="structure-error-banner">
      <div className="sa-error">{message}</div>
    </div>
  );
}
