"use client"

import { Suspense, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID!

export function getFbc(): string | undefined {
  if (typeof document === "undefined") return undefined
  const match = document.cookie.match(/(?:^|;\s*)_fbc=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : undefined
}

export function getFbp(): string | undefined {
  if (typeof document === "undefined") return undefined
  const match = document.cookie.match(/(?:^|;\s*)_fbp=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : undefined
}

function MetaPixelInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Capture fbclid from URL and store as _fbc cookie
  useEffect(() => {
    const fbclid = searchParams.get("fbclid")
    if (fbclid) {
      const fbc = `fb.1.${Date.now()}.${fbclid}`
      document.cookie = `_fbc=${fbc}; path=/; max-age=${90 * 24 * 60 * 60}; SameSite=Lax`
    }
  }, [searchParams])

  // Fire PageView on route changes
  useEffect(() => {
    if ((window as any).fbq) {
      ;(window as any).fbq("track", "PageView")
    }
  }, [pathname])

  return null
}

export default function MetaPixel() {
  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <Suspense fallback={null}>
        <MetaPixelInner />
      </Suspense>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
