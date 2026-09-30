import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="page-wrap">
      <div className="page-heading" style={{ display: "block", textAlign: "center" }}>
        <div className="eyebrow" style={{ justifyContent: "center" }}>NOURIVA PLANS</div>
        <h1>Subscriptions — Coming Soon</h1>
        <p>All current Nouriva features are available to you. Subscription plans are coming soon.</p>
        <Link href="/dashboard" className="button button-ghost">Back to Nouriva</Link>
      </div>
    </div>
  );
}
