import React, { useEffect, useState, useMemo } from "react";
import "../../Styles/Admin.css";

export default function Admin() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  
  const [busy, setBusy] = useState({});
  const [status, setStatus] = useState('pending');

  // Simple in-app toast message
  const [toast, setToast] = useState(null);

  // --- sound support ---
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioCtx, setAudioCtx] = useState(null);

  const enableSound = async () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      if (ctx.state === 'suspended') await ctx.resume();
      setAudioCtx(ctx);
      setSoundEnabled(true);
    } catch {}
  };

  const playSound = async () => {
    try {
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const ctx = audioCtx;
      const t0 = ctx.currentTime + 0.01;

      const master = ctx.createGain();
      master.gain.value = 0.6;
      master.connect(ctx.destination);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, t0);
      filter.Q.value = 0.7;
      filter.connect(master);

      const ping = (start, baseFreq, dur, level = 1) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const g = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc2.detune.value = +8; // subtle shimmer

        // gentle upward pitch glide
        osc1.frequency.setValueAtTime(baseFreq, start);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.06, start + dur * 0.6);
        osc2.frequency.setValueAtTime(baseFreq, start);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.06, start + dur * 0.6);

        // percussive envelope
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.4 * level, start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

        osc1.connect(g);
        osc2.connect(g);
        g.connect(filter);

        osc1.start(start);
        osc2.start(start);
        osc1.stop(start + dur + 0.02);
        osc2.stop(start + dur + 0.02);
      };

      // two-note “pop/ding”
      ping(t0, 740, 0.12, 0.9);     // lower blip
      ping(t0 + 0.06, 1240, 0.18);  // higher chime

      setTimeout(() => {
        try { filter.disconnect(); master.disconnect(); } catch {}
      }, 400);
    } catch {}
  };

  useEffect(() => {
    return () => {
      try { audioCtx?.close(); } catch {}
    };
  }, [audioCtx]);
  // --- end sound support ---

  const fetchRequests = async (which = status) => {
    try {
      setLoading(true);
      setErr("");
      const s = typeof which === 'string' ? which : status; // guard against event object
      const res = await fetch(`http://localhost:3001/api/license-requests?status=${s}`);
      const data = await res.json();
      if (data.status !== "success") throw new Error(data.message || "Failed to load");
      setRequests(data.requests || []);
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(status);
  }, [status]);

  // Subscribe to server-sent events for new pending requests
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
      const es = new EventSource('http://localhost:3001/api/license-requests/stream');
      const onNew = async (e) => {
        try {
          const data = JSON.parse(e.data || '{}');

          // sound first (if enabled)
          if (soundEnabled) await playSound();

          if (window.Notification && Notification.permission === 'granted') {
            new Notification('New license request', {
              body: `${data.licenseNumber} • ${data.doctorEmail}`
            });
          } else {
            setToast({ message: `New license request: ${data.licenseNumber} • ${data.doctorEmail}` });
            setTimeout(() => setToast(null), 6000);
          }
          fetchRequests('pending');
        } catch {}
      };
      es.addEventListener('license_request_pending', onNew);
      es.onerror = () => { /* let browser auto-reconnect */ };
      return () => {
        es.removeEventListener('license_request_pending', onNew);
        es.close();
      };
    } catch {}
  }, [soundEnabled]); // re-bind if sound toggle changes

  const pendingCount = useMemo(() => requests.length, [requests]);

  const actOnRequest = async (id, status, licenseNumber) => {
    const verb = status === "approved" ? "Approve" : "Reject";
    const extra = status === 'approved' ? "\n\nNote: This will revoke any other approved license for this doctor." : "";
    if (!window.confirm(`${verb} license ${licenseNumber}?${extra}`)) return;

    try {
      setBusy((b) => ({ ...b, [id]: true }));
      const res = await fetch(`http://localhost:3001/api/license-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.status !== "success") throw new Error(data.message || "Action failed");
      if (data.autoRevoked) {
        console.info(`Auto-revoked ${data.autoRevoked} previous approved license(s).`);
      }
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      alert(e.message || "Action failed");
    } finally {
      setBusy((b) => {
        const n = { ...b };
        delete n[id];
        return n;
      });
    }
  };

  return (
    <div className="page">
      {/* Toast notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            right: 16,
            top: 16,
            background: '#1f2937',
            color: 'white',
            padding: '10px 14px',
            borderRadius: 8,
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            zIndex: 1000,
            maxWidth: 360
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 600 }}>Notification</span>
            <button
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
              style={{
                marginLeft: 'auto',
                border: 'none',
                background: 'transparent',
                color: 'white',
                fontSize: 18,
                cursor: 'pointer',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          <div style={{ marginTop: 6, fontSize: 14 }}>{toast.message}</div>
        </div>
      )}

      <header className="page-header">
        <h1 className="page-title">Manage License Requests</h1>
        <div className="header-actions">
          <div className="btn-group" role="group" aria-label="License filters">
            <button
              className={`btn ${status === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setStatus('pending')}
              disabled={loading}
            >
              Pending
            </button>
            <button
              className={`btn ${status === 'approved' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setStatus('approved')}
              disabled={loading}
            >
              Approved
            </button>
            <button
              className={`btn ${status === 'rejected' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setStatus('rejected')}
              disabled={loading}
            >
              Rejected
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => fetchRequests()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            className={`btn ${soundEnabled ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={enableSound}
            title={soundEnabled ? 'Sound is enabled' : 'Enable notification sound'}
          >
            {soundEnabled ? 'Sound On' : 'Enable Sound'}
          </button>
        </div>
      </header>

      {err && (
        <div role="alert" className="alert error">
          {err}
        </div>
      )}

      <section className="card">
        <div className="card-head">
          <h2 className="card-title" style={{ textTransform: 'capitalize' }}>{status}</h2>
        </div>

        <div className="table-wrap">
          <table className="table" role="table" aria-label="Pending license requests">
            <thead>
              <tr>
                <th>#</th>
                <th>Doctor Email</th>
                <th>License Number</th>
                <th>Submitted</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="center muted">Loading…</td>
                </tr>
              )}

              {!loading && requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="center muted empty">
                    No {status} requests.
                  </td>
                </tr>
              )}

              {!loading &&
                requests.map((r, idx) => (
                  <tr key={r._id}>
                    <td>{idx + 1}</td>
                    <td className="truncate" title={r.doctorEmail}>{r.doctorEmail}</td>
                    <td className="mono">{r.licenseNumber}</td>
                    <td title={new Date(r.createdAt).toLocaleString()}>
                      {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="col-actions">
                      {(status === 'pending' || status === 'rejected') && (
                        <button
                          className="btn btn-approve"
                          onClick={() => actOnRequest(r._id, "approved", r.licenseNumber)}
                          disabled={!!busy[r._id]}
                          aria-label={`Approve ${r.licenseNumber}`}
                        >
                          {busy[r._id] ? "…" : "Approve"}
                        </button>
                      )}
                      {(status === 'pending' || status === 'approved') && (
                        <button
                          className="btn btn-reject"
                          onClick={() => actOnRequest(r._id, "rejected", r.licenseNumber)}
                          disabled={!!busy[r._id]}
                          aria-label={`Reject ${r.licenseNumber}`}
                        >
                          {busy[r._id] ? "…" : "Reject"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}