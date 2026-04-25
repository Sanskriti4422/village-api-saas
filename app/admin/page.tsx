import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatQuota, getDailyRequestLimit } from "@/lib/plans";

function formatDateTime(date: Date | null) {
  if (!date) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function AdminStyles() {
  return (
    <style>{`
      .admin {
        min-height: 100vh;
        background: #f8fafc;
        color: #020617;
        font-family: Arial, Helvetica, sans-serif;
      }

      .admin a {
        color: inherit;
        text-decoration: none;
      }

      .admin-header {
        border-bottom: 1px solid #e2e8f0;
        background: #ffffff;
      }

      .admin-header-inner,
      .admin-main {
        width: min(1280px, calc(100% - 48px));
        margin: 0 auto;
      }

      .admin-header-inner {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 24px;
        padding: 32px 0;
      }

      .eyebrow {
        color: #0369a1;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: .04em;
        text-transform: uppercase;
      }

      .admin h1 {
        margin: 8px 0 0;
        font-size: 34px;
        line-height: 1.15;
      }

      .muted {
        color: #475569;
        font-size: 14px;
        line-height: 1.65;
      }

      .button-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        padding: 0 16px;
        color: #1e293b;
        font-size: 14px;
        font-weight: 600;
      }

      .primary {
        border-color: #0369a1;
        background: #0369a1;
        color: white;
      }

      .admin-main {
        padding: 32px 0;
      }

      .metric-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }

      .card {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #ffffff;
      }

      .metric {
        padding: 20px;
      }

      .label {
        margin: 0;
        color: #64748b;
        font-size: 14px;
      }

      .value {
        margin: 8px 0 0;
        font-size: 24px;
        font-weight: 700;
      }

      .section-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-top: 24px;
      }

      .card-header {
        border-bottom: 1px solid #e2e8f0;
        padding: 20px;
      }

      .card-title {
        margin: 0;
        font-size: 20px;
      }

      .list {
        display: grid;
        gap: 12px;
        padding: 20px;
      }

      .list-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 12px;
      }

      .list-row:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }

      .pill {
        display: inline-flex;
        border-radius: 6px;
        background: #eff6ff;
        padding: 4px 8px;
        color: #1d4ed8;
        font-size: 12px;
        font-weight: 700;
      }

      .table-wrap {
        overflow-x: auto;
      }

      table {
        width: 100%;
        min-width: 760px;
        border-collapse: collapse;
        text-align: left;
        font-size: 14px;
      }

      th {
        background: #f1f5f9;
        color: #475569;
        font-weight: 600;
      }

      th,
      td {
        border-top: 1px solid #e2e8f0;
        padding: 14px 20px;
      }

      .wide {
        margin-top: 24px;
      }

      .mono {
        font-family: Consolas, "Courier New", monospace;
        font-size: 12px;
      }

      @media (max-width: 1000px) {
        .metric-grid,
        .section-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 700px) {
        .admin-header-inner {
          align-items: start;
          flex-direction: column;
        }

        .metric-grid,
        .section-grid {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}

export default async function AdminPage() {
  const today = startOfToday();

  const [
    states,
    districts,
    subDistricts,
    villages,
    users,
    apiKeys,
    activeApiKeys,
    requestsToday,
    totalRequests,
    planGroups,
    recentLogs,
    topStates,
  ] = await Promise.all([
    prisma.state.count(),
    prisma.district.count(),
    prisma.subDistrict.count(),
    prisma.village.count(),
    prisma.user.count(),
    prisma.apiKey.count(),
    prisma.apiKey.count({ where: { isActive: true } }),
    prisma.usageLog.count({ where: { createdAt: { gte: today } } }),
    prisma.usageLog.count(),
    prisma.user.groupBy({
      by: ["plan"],
      _count: {
        id: true,
      },
    }),
    prisma.usageLog.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        apiKey: {
          include: {
            user: true,
          },
        },
      },
    }),
    prisma.state.findMany({
      take: 8,
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            districts: true,
          },
        },
      },
    }),
  ]);

  return (
    <main className="admin">
      <AdminStyles />
      <section className="admin-header">
        <div className="admin-header-inner">
          <div>
            <p className="eyebrow">Owner Console</p>
            <h1>Admin Dashboard</h1>
            <p className="muted">
              Track imported data coverage, users, API keys, usage volume, and
              recent client activity.
            </p>
          </div>
          <div className="button-row">
            <Link href="/dashboard" className="button">
              Client dashboard
            </Link>
            <Link href="/api/v1/states" className="button primary">
              Test API
            </Link>
          </div>
        </div>
      </section>

      <section className="admin-main">
        <div className="metric-grid">
          <div className="card metric">
            <p className="label">States / UTs</p>
            <p className="value">{states.toLocaleString("en-IN")}</p>
            <p className="muted">Imported source files</p>
          </div>
          <div className="card metric">
            <p className="label">Districts</p>
            <p className="value">{districts.toLocaleString("en-IN")}</p>
            <p className="muted">Normalized hierarchy</p>
          </div>
          <div className="card metric">
            <p className="label">Sub-districts</p>
            <p className="value">{subDistricts.toLocaleString("en-IN")}</p>
            <p className="muted">Mapped from dataset</p>
          </div>
          <div className="card metric">
            <p className="label">Villages</p>
            <p className="value">{villages.toLocaleString("en-IN")}</p>
            <p className="muted">Autocomplete-ready records</p>
          </div>
        </div>

        <div className="metric-grid" style={{ marginTop: 16 }}>
          <div className="card metric">
            <p className="label">Users</p>
            <p className="value">{users.toLocaleString("en-IN")}</p>
            <p className="muted">Registered clients</p>
          </div>
          <div className="card metric">
            <p className="label">API Keys</p>
            <p className="value">{apiKeys.toLocaleString("en-IN")}</p>
            <p className="muted">{activeApiKeys} active</p>
          </div>
          <div className="card metric">
            <p className="label">Requests Today</p>
            <p className="value">{requestsToday.toLocaleString("en-IN")}</p>
            <p className="muted">Across all clients</p>
          </div>
          <div className="card metric">
            <p className="label">Total Requests</p>
            <p className="value">{totalRequests.toLocaleString("en-IN")}</p>
            <p className="muted">Logged API calls</p>
          </div>
        </div>

        <div className="section-grid">
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Plan Distribution</h2>
              <p className="muted">Client count and daily quota by plan.</p>
            </div>
            <div className="list">
              {planGroups.map((group) => (
                <div className="list-row" key={group.plan}>
                  <div>
                    <strong>{group.plan}</strong>
                    <p className="muted">
                      {formatQuota(getDailyRequestLimit(group.plan))} requests/day
                    </p>
                  </div>
                  <span className="pill">{group._count.id} users</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Dataset Sample</h2>
              <p className="muted">First imported states with district counts.</p>
            </div>
            <div className="list">
              {topStates.map((state) => (
                <div className="list-row" key={state.id}>
                  <strong>{state.name}</strong>
                  <span className="pill">{state._count.districts} districts</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="card wide">
          <div className="card-header">
            <h2 className="card-title">Recent Usage</h2>
            <p className="muted">Latest API calls logged by authenticated keys.</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Client</th>
                  <th>Plan</th>
                  <th>Key</th>
                  <th>Endpoint</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.createdAt)}</td>
                    <td>{log.apiKey.user.email}</td>
                    <td>{log.apiKey.user.plan}</td>
                    <td className="mono">{log.apiKey.keyPrefix}...</td>
                    <td className="mono">{log.endpoint}</td>
                    <td>{log.status}</td>
                  </tr>
                ))}
                {recentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No usage logs yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
