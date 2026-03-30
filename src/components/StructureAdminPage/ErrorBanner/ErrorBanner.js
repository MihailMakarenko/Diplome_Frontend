import React from "react";
import "./ErrorBanner.css";

export default function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="sa-error">{message}</div>;
}
