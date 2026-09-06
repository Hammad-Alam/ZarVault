interface Props {
  type: "success" | "error" | "warning" | "info";
  message: string;
  onDismiss: () => void;
}

const icons = { success: "✓", error: "!", warning: "!", info: "i" };

export function Toast({ type, message, onDismiss }: Props) {
  return (
    <div
      className="fade-in fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-[#DFE8E4] bg-white px-4 py-3 shadow-[0_16px_40px_rgba(13,74,70,0.16)]"
      role="status"
      aria-live="polite"
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${type === "success" ? "bg-[#F0F5E8] text-[#537629]" : type === "error" ? "bg-[#FBEDEA] text-[#A5483D]" : "bg-[#E9F2F0] text-[#0D4A46]"}`}
      >
        {icons[type]}
      </span>
      <p className="text-sm font-medium text-[#1A1F1B]">{message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-2 text-lg leading-none text-[#66736E]"
      >
        ×
      </button>
    </div>
  );
}
