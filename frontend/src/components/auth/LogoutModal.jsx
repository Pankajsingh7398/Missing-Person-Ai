import React from "react";

export default function LogoutModal({ isOpen, onCancel, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Sign out of dashboard?</h3>
        <p>You will need to sign in again to access the investigation dashboard.</p>
        <div className="modal-actions">
          <button type="button" className="modal-btn modal-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="modal-btn modal-btn-primary" onClick={onConfirm}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
