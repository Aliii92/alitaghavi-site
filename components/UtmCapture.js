"use client";

import { useEffect } from "react";

const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

export default function UtmCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incoming = {};
    let hasIncomingUtm = false;

    utmKeys.forEach((key) => {
      const value = params.get(key);
      if (value) {
        incoming[key] = value;
        hasIncomingUtm = true;
      }
    });

    if (hasIncomingUtm) {
      window.localStorage.setItem("ali_site_utm", JSON.stringify(incoming));
      return;
    }

    if (!window.localStorage.getItem("ali_site_utm")) {
      window.localStorage.setItem(
        "ali_site_utm",
        JSON.stringify({
          utm_source: "direct",
          utm_medium: "",
          utm_campaign: "",
          utm_content: "",
          utm_term: ""
        })
      );
    }
  }, []);

  return null;
}
