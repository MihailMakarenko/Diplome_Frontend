import React from "react";
import "./SectionCard.css";

export default function SectionCard({
  title,
  children,
  className = "",
  bodyClassName = "",
}) {
  return (
    <section className={`sa-card ${className}`}>
      {title && <h3 className="sa-cardTitle">{title}</h3>}
      <div className={`sa-cardBody ${bodyClassName}`}>{children}</div>
    </section>
  );
}
