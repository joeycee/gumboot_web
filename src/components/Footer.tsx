import Link from "next/link";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  .footer-root * { box-sizing: border-box; }
  .footer-root {
    background: #2A3439;
    border-top: 1px solid rgba(229,229,229,0.07);
    font-family: 'DM Sans', sans-serif;
    color: #E5E5E5;
  }

  .footer-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 48px 24px 32px;
  }

  /* Top section */
  .footer-top {
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr 1fr;
    gap: 40px;
    padding-bottom: 40px;
    border-bottom: 1px solid rgba(229,229,229,0.07);
  }
  @media (max-width: 860px) {
    .footer-top { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 500px) {
    .footer-top { grid-template-columns: 1fr; gap: 28px; }
  }
  @media (max-width: 640px) {
    .footer-inner {
      padding: 36px 16px 28px;
    }
    .footer-brand-desc {
      max-width: none;
    }
    .footer-bottom {
      align-items: flex-start;
      flex-direction: column;
    }
    .footer-bottom-links {
      width: 100%;
      flex-wrap: wrap;
      gap: 14px;
    }
  }

  /* Brand column */
  .footer-brand {}
  .footer-logo {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    font-weight: 400;
    color: #E5E5E5;
    letter-spacing: -0.01em;
    margin-bottom: 12px;
    display: block;
    text-decoration: none;
  }
  .footer-logo-dot { color: #26A69A; }
  .footer-brand-desc {
    font-size: 13px;
    color: rgba(229,229,229,0.42);
    line-height: 1.7;
    font-weight: 300;
    max-width: 220px;
  }
  .footer-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 20px;
    background: rgba(38,166,154,0.10);
    border: 1px solid rgba(38,166,154,0.20);
    border-radius: 20px;
    padding: 5px 12px;
    font-size: 11px;
    font-weight: 500;
    color: #26A69A;
    letter-spacing: 0.04em;
  }
  .footer-badge-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #26A69A;
    animation: footer-pulse 2s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes footer-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  /* Link columns */
  .footer-col-title {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.35);
    margin-bottom: 16px;
  }
  .footer-col-links {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .footer-link {
    font-size: 13px;
    color: rgba(229,229,229,0.48);
    text-decoration: none;
    transition: color 0.14s;
    line-height: 1;
  }
  .footer-link:hover { color: #E5E5E5; }
  .footer-link-teal { color: #26A69A; }
  .footer-link-teal:hover { color: #2ec4b6; }

  /* Bottom bar */
  .footer-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 24px;
    gap: 16px;
    flex-wrap: wrap;
  }
  .footer-copy {
    font-size: 12px;
    color: rgba(229,229,229,0.28);
    letter-spacing: 0.02em;
  }
  .footer-bottom-links {
    display: flex;
    gap: 20px;
  }
  .footer-bottom-link {
    font-size: 12px;
    color: rgba(229,229,229,0.30);
    text-decoration: none;
    transition: color 0.14s;
  }
  .footer-bottom-link:hover { color: rgba(229,229,229,0.65); }
`;

const LINKS = {
  platform: [
    { label: "Browse jobs", href: "/" },
    { label: "Post a job", href: "/auth/signup" },
    { label: "Manage jobs", href: "/jobs/manage" },
    { label: "FAQ", href: "/faq" },
  ],
  account: [
    { label: "Sign up", href: "/auth/signup" },
    { label: "Sign in", href: "/auth/login" },
    { label: "Profile", href: "/profile" },
    { label: "Wallet & payments", href: "/profile/payments" },
    { label: "Settings", href: "/profile/settings" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Support", href: "/support" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
      <style>{styles}</style>
      <footer className="footer-root" role="contentinfo">
        <div className="footer-inner">

          {/* Top grid */}
          <div className="footer-top">

            {/* Brand */}
            <div className="footer-brand">
              <Link href="/" className="footer-logo">
                Gumboot<span className="footer-logo-dot">.</span>
              </Link>
              <p className="footer-brand-desc">
                Book trusted local help in minutes. Verified taskers, secure payments, and real reviews.
              </p>
              <span className="footer-badge">
                <span className="footer-badge-dot" />
                Live in New Zealand
              </span>
            </div>

            {/* Platform */}
            <div>
              <p className="footer-col-title">Platform</p>
              <div className="footer-col-links">
                {LINKS.platform.map(({ label, href }) => (
                  <Link key={label} href={href} className="footer-link">{label}</Link>
                ))}
              </div>
            </div>

            {/* Account */}
            <div>
              <p className="footer-col-title">Account</p>
              <div className="footer-col-links">
                {LINKS.account.map(({ label, href }) => (
                  <Link key={label} href={href} className="footer-link">{label}</Link>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <p className="footer-col-title">Company</p>
              <div className="footer-col-links">
                {LINKS.company.map(({ label, href }) => (
                  <Link key={label} href={href} className="footer-link">{label}</Link>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="footer-bottom">
            <p className="footer-copy">© {year} Gumboot Ltd. All rights reserved.</p>
            <div className="footer-bottom-links">
              <Link href="/privacy" className="footer-bottom-link">Privacy Policy</Link>
              <Link href="/terms" className="footer-bottom-link">Terms of Service</Link>
              <Link href="/faq" className="footer-bottom-link">FAQ</Link>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}
