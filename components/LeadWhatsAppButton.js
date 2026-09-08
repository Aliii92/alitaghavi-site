"use client";

export default function LeadWhatsAppButton({ href, lead, className = "button whatsapp-button", children }) {
  function getStoredUtm() {
    try {
      return JSON.parse(window.localStorage.getItem("ali_site_utm") || "{}");
    } catch {
      return {};
    }
  }

  function handleClick(event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const params = new URLSearchParams(window.location.search);
    const storedUtm = getStoredUtm();
    const payload = {
      ...lead,
      referrer_url: window.location.href,
      user_agent: navigator.userAgent,
      utm_source: params.get("utm_source") || storedUtm.utm_source || "direct",
      utm_medium: params.get("utm_medium") || storedUtm.utm_medium || "",
      utm_campaign: params.get("utm_campaign") || storedUtm.utm_campaign || "",
      utm_content: params.get("utm_content") || storedUtm.utm_content || "",
      utm_term: params.get("utm_term") || storedUtm.utm_term || ""
    };

    // Keep normal anchor navigation immediate; tracking must never delay contact.
    void fetch("/api/leads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), keepalive: true
    }).catch(() => {});

  }

  return (
    <a className={className} href={href} onClick={handleClick}>
      {children}
    </a>
  );
}

