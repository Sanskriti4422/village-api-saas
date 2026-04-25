import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatQuota, getDailyRequestLimit } from "@/lib/plans";

const DEMO_EMAIL = "demo-client@example.com";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateTime(date: Date | null) {
  if (!date) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function DashboardStyles() {
  return (
    <style>{`
      .dashboard {
        min-height: 100vh;
        background: #f8fafc;
        color: #020617;
        font-family: Arial, Helvetica, sans-serif;
      }

      .dashboard a {
        color: inherit;
        text-decoration: none;
      }

      .dashboard-header {
        border-bottom: 1px solid #e2e8f0;
        background: #ffffff;
      }

      .dashboard-header-inner,
      .dashboard-main {
        width: min(1280px, calc(100% - 48px));
        margin: 0 auto;
      }

      .dashboard-header-inner {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 24px;
        padding: 32px 0;
      }

      .eyebrow {
        color: #047857;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: .04em;
        text-transform: uppercase;
      }

      .dashboard h1 {
        margin: 8px 0 0;
        font-size: 34px;
        line-height: 1.15;
      }

      .muted {
        color: #475569;
        font-size: 14px;
        line-height: 1.65;
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

      .dashboard-main {
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
        font-size: 22px;
        font-weight: 700;
      }

      .content-grid {
        display: grid;
        grid-template-columns: 1.15fr .85fr;
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

      .table-wrap {
        overflow-x: auto;
      }

      table {
        width: 100%;
        min-width: 640px;
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

      .mono {
        font-family: Consolas, "Courier New", monospace;
        font-size: 12px;
      }

      .pill {
        display: inline-flex;
        border-radius: 6px;
        background: #ecfdf5;
        padding: 4px 8px;
        color: #047857;
        font-size: 12px;
        font-weight: 700;
      }

      .side-card {
        padding: 20px;
      }

      .endpoint-list {
        display: grid;
        gap: 12px;
        margin-top: 20px;
      }

      .endpoint {
        display: block;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: #f8fafc;
        padding: 12px;
        color: #334155;
        font-family: Consolas, "Courier New", monospace;
        font-size: 12px;
        overflow-wrap: anywhere;
      }

      .note {
        margin-top: 24px;
        border: 1px solid #fde68a;
        border-radius: 6px;
        background: #fffbeb;
        padding: 16px;
        color: #713f12;
        font-size: 14px;
        line-height: 1.6;
      }

      @media (max-width: 900px) {
        .dashboard-header-inner {
          align-items: start;
          flex-direction: column;
        }

        .metric-grid,
        .content-grid {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}

export default async function DashboardPage() {
  const user = await prisma.user.findUnique({
    where: {
      email: DEMO_EMAIL,
    },
    include: {
      apiKeys: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    return (
      <main className="dashboard">
        <DashboardStyles />
        <section className="dashboard-main">
          <div className="card metric">
            <p className="eyebrow">Dashboard</p>
            <h1>Demo client not found</h1>
            <p className="muted">
              Run <code>npx tsx scripts/create-demo-api-key.ts</code> and
              refresh this page.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const primaryKey = user.apiKeys[0];
  const dailyLimit = getDailyRequestLimit(user.plan);
  const usageToday = primaryKey
    ? await prisma.usageLog.count({
        where: {
          apiKeyId: primaryKey.id,
          createdAt: {
            gte: startOfToday(),
          },
        },
      })
    : 0;
  const remaining =
    dailyLimit === null ? null : Math.max(dailyLimit - usageToday, 0);
  const endpointBase = "http://localhost:3000/api/v1";

  return (
    <main className="dashboard">
      <DashboardStyles />
      <section className="dashboard-header">
        <div className="dashboard-header-inner">
          <div>
            <p className="eyebrow">India Village API</p>
            <h1>Client Dashboard</h1>
            <p className="muted">
              Monitor API usage, inspect keys, and test village autocomplete
              endpoints from one place.
            </p>
          </div>
          <Link href="/api/v1/autocomplete?q=ram&limit=5" className="button">
            Test without key
          </Link>
        </div>
      </section>

      <section className="dashboard-main">
        <div className="metric-grid">
          <div className="card metric">
            <p className="label">Client</p>
            <p className="value">{user.name}</p>
            <p className="muted">{user.email}</p>
          </div>
          <div className="card metric">
            <p className="label">Current Plan</p>
            <p className="value">{user.plan}</p>
            <p className="muted">{formatQuota(dailyLimit)} requests/day</p>
          </div>
          <div className="card metric">
            <p className="label">Used Today</p>
            <p className="value">{usageToday.toLocaleString("en-IN")}</p>
            <p className="muted">
              {remaining === null
                ? "Unlimited remaining"
                : `${remaining.toLocaleString("en-IN")} remaining`}
            </p>
          </div>
          <div className="card metric">
            <p className="label">Active Keys</p>
            <p className="value">
              {user.apiKeys.filter((key) => key.isActive).length}
            </p>
            <p className="muted">
              {primaryKey
                ? `Last used ${formatDateTime(primaryKey.lastUsedAt)}`
                : "No key yet"}
            </p>
          </div>
        </div>

        <div className="content-grid">
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">API Keys</h2>
              <p className="muted">
                Full keys are shown only when created. Store them securely.
              </p>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Prefix</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Last Used</th>
                  </tr>
                </thead>
                <tbody>
                  {user.apiKeys.map((key) => (
                    <tr key={key.id}>
                      <td>{key.name}</td>
                      <td className="mono">{key.keyPrefix}...</td>
                      <td>
                        <span className="pill">
                          {key.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{formatDateTime(key.createdAt)}</td>
                      <td>{formatDateTime(key.lastUsedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card side-card">
            <h2 className="card-title">Quick Test</h2>
            <p className="muted">
              Use your copied demo key as <code>api_key</code> in the browser or
              as <code>x-api-key</code> from code.
            </p>
            <div className="endpoint-list">
              <a
                className="endpoint"
                href={`${endpointBase}/autocomplete?q=ram&limit=5`}
              >
                GET /autocomplete?q=ram&amp;limit=5
              </a>
              <a className="endpoint" href={`${endpointBase}/states`}>
                GET /states
              </a>
            </div>
            <div className="note">
              Browser links above intentionally omit the key so you can verify
              that protected endpoints return <strong>401</strong>. Add{" "}
              <code>?api_key=YOUR_KEY</code> to test success.
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
