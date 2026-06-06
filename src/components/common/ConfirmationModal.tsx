import { useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  details,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onCancel();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
      }}
    >
      <div
        className="bg-dark text-light border border-secondary rounded"
        style={{ width: "100%", maxWidth: 480, margin: "1rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-secondary">
          <h6 className="mb-0 fw-semibold" id="confirm-modal-title">
            {title}
          </h6>
          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Close"
            onClick={onCancel}
          />
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <p className="mb-0">{message}</p>
          {details && (
            <p className="mb-0 mt-2 small" style={{ color: "#9ca3af" }}>
              {details}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="d-flex justify-content-end gap-2 px-4 py-3 border-top border-secondary">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${destructive ? "btn-danger" : "btn-primary"}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
