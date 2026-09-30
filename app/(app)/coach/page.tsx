import Link from "next/link";

export default function CoachPage() {
  return (
    <div className="page-wrap">
      <div className="page-heading">
        <div>
          <div className="eyebrow">NOURIVA COACH</div>
          <h1>AI Coach — Coming Soon</h1>
          <p>AI-powered coaching is not available yet. Your other Nouriva features remain ready to use.</p>
          <Link href="/dashboard" className="button button-ghost">Back to Nouriva</Link>
        </div>
      </div>
    </div>
  );
}
