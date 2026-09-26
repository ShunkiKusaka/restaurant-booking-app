"use client";

// 押したときに確認ダイアログを出すボタン。「キャンセル」など取り消しにくい操作に使う。
export default function ConfirmButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
