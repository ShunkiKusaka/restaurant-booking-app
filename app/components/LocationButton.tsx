"use client";

// 「現在地から探す」ボタン。ブラウザに位置情報をたずねて、トップページのURLに付けて開き直す。
// 位置はおよそ100m単位に丸めてからURLに入れる(細かい現在地をURLに残さないため)。
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LocationButton({
  keep,
  label = "現在地から探す",
  className = "",
}: {
  keep: Record<string, string>; // 一緒に残す検索条件(ジャンル、半径など)
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setMessage("このブラウザでは、現在地を使えません。");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const params = new URLSearchParams(keep);
        params.set("lat", pos.coords.latitude.toFixed(3));
        params.set("lng", pos.coords.longitude.toFixed(3));
        setStatus("idle");
        router.push(`/?${params.toString()}#results`);
      },
      (err) => {
        setStatus("error");
        setMessage(
          err.code === err.PERMISSION_DENIED
            ? "位置情報の利用が許可されていません。ブラウザの設定で、このサイトの位置情報を許可してください。"
            : "現在地を確認できませんでした。電波のよい場所で、もう一度お試しください。"
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  };

  return (
    <div>
      <button
        type="button"
        onClick={locate}
        disabled={status === "loading"}
        className={`inline-flex min-h-10 items-center gap-2 rounded-md border border-brand bg-surface px-4 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-60 ${className}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        {status === "loading" ? "現在地を確認しています…" : label}
      </button>
      {status === "error" && (
        <p role="alert" className="mt-2 text-sm text-danger">{message}</p>
      )}
    </div>
  );
}
