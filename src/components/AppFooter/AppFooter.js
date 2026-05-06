import React from "react";
import "./AppFooter.css";

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer__container">
        {/* Левая часть — копирайт и название */}
        <div className="app-footer__brand">
          <span className="app-footer__university">БРУ</span>
          <span className="app-footer__divider-dot">·</span>
          <span className="app-footer__dept">Хозяйственный отдел</span>
        </div>

        {/* Центральная часть — контакты и график в одну строку */}
        <div className="app-footer__info">
          <a href="tel:+375222711467" className="app-footer__contact">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8 10a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            +375 (22) 271-14-67
          </a>

          <span className="app-footer__separator">|</span>

          <a href="mailto:mtbd@exec.bru.by" className="app-footer__contact">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            mtbd@exec.bru.by
          </a>

          <span className="app-footer__separator">|</span>

          <span className="app-footer__schedule">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            8:15 – 17:15
          </span>
        </div>

        {/* Правая часть — автор и версия */}
        <div className="app-footer__meta">
          <span className="app-footer__version">v1.0</span>
          <span className="app-footer__author">
            <span className="app-footer__author-label">дипломный проект</span>
            Макаренко М.А.
          </span>
          <span className="app-footer__year">© {currentYear}</span>
        </div>
      </div>
    </footer>
  );
}
