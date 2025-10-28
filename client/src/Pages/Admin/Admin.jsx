import React, { useEffect, useState, useMemo } from "react";
import "../../Styles/Admin.css";

export default function Admin() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  
  const [busy, setBusy] = useState({});

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await fetch("http://localhost:3001/api/license-requests?status=pending");
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
    fetchRequests();
  }, []);

  const pendingCount = useMemo(() => requests.length, [requests]);

  const actOnRequest = async (id, status, licenseNumber) => {
    const verb = status === "approved" ? "Approve" : "Reject";
    if (!window.confirm(`${verb} license ${licenseNumber}?`)) return;

    try {
      setBusy((b) => ({ ...b, [id]: true }));
      const res = await fetch(`http://localhost:3001/api/license-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.status !== "success") throw new Error(data.message || "Action failed");
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
      <header className="page-header">
        <h1 className="page-title">Manage License Requests</h1>
        <div className="header-actions">
          <span className="muted">{pendingCount} pending</span>
          <button className="btn btn-primary" onClick={fetchRequests} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
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
          <h2 className="card-title">Pending</h2>
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
                    No pending requests.
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
                      <button
                        className="btn btn-approve"
                        onClick={() => actOnRequest(r._id, "approved", r.licenseNumber)}
                        disabled={!!busy[r._id]}
                        aria-label={`Approve ${r.licenseNumber}`}
                      >
                        {busy[r._id] ? "…" : "Approve"}
                      </button>
                      <button
                        className="btn btn-reject"
                        onClick={() => actOnRequest(r._id, "rejected", r.licenseNumber)}
                        disabled={!!busy[r._id]}
                        aria-label={`Reject ${r.licenseNumber}`}
                      >
                        {busy[r._id] ? "…" : "Reject"}
                      </button>
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
