// apps/admin/src/SuperAdminsAdmin.tsx
// Super Admin management panel - create, manage, and sync super admins
import * as React from "react";
import { PageHeader, Card, Button, Input, SectionCard } from "@bhq/ui";
import { superAdminApi, type SuperAdminDTO } from "./api";

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d);
}

export default function SuperAdminsAdmin() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [superAdmins, setSuperAdmins] = React.useState<SuperAdminDTO[]>([]);

  // Create modal state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createWorking, setCreateWorking] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = React.useState<string | null>(null);

  // Form fields
  const [newEmail, setNewEmail] = React.useState("");
  const [newFirstName, setNewFirstName] = React.useState("");
  const [newLastName, setNewLastName] = React.useState("");
  const [generatePassword, setGeneratePassword] = React.useState(true);
  const [newTempPassword, setNewTempPassword] = React.useState("");

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await superAdminApi.listSuperAdmins();
      setSuperAdmins(res.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load super admins");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const isEmail = (s: string) => /\S+@\S+\.\S+/.test(s);
  const canCreate =
    newEmail.trim().length > 0 &&
    isEmail(newEmail.trim()) &&
    newFirstName.trim().length > 0 &&
    (generatePassword || newTempPassword.trim().length >= 8);

  const doCreateSuperAdmin = async () => {
    if (!canCreate) {
      setCreateErr("Please enter a valid email, first name, and password (or enable generate).");
      return;
    }
    try {
      setCreateWorking(true);
      setCreateErr(null);

      const res = await superAdminApi.createSuperAdmin({
        email: newEmail.trim(),
        firstName: newFirstName.trim(),
        lastName: newLastName.trim() || null,
        verify: true,
        tempPassword: generatePassword ? undefined : newTempPassword.trim(),
        generateTempPassword: generatePassword,
      });

      setCreatedPassword(res.tempPassword || null);
      setSuperAdmins((prev) => [res.user, ...prev]);
      setNewEmail("");
      setNewFirstName("");
      setNewLastName("");
      setNewTempPassword("");
    } catch (e: any) {
      setCreateErr(e?.message || "Failed to create super admin");
    } finally {
      setCreateWorking(false);
    }
  };

  const resetCreateModal = () => {
    setCreateOpen(false);
    setCreatedPassword(null);
    setCreateErr(null);
    setNewEmail("");
    setNewFirstName("");
    setNewLastName("");
    setNewTempPassword("");
    setGeneratePassword(true);
  };

  const handleRevoke = async (user: SuperAdminDTO) => {
    const ok = window.confirm(
      `Revoke super admin status from ${user.email}?\n\nThey will keep their existing tenant memberships but won't be auto-added to new tenants.`
    );
    if (!ok) return;

    try {
      await superAdminApi.revokeSuperAdmin(user.id);
      setSuperAdmins((prev) => prev.filter((u) => u.id !== user.id));
    } catch (e: any) {
      alert(e?.message || "Failed to revoke super admin status");
    }
  };

  const handleSync = async (user: SuperAdminDTO) => {
    try {
      const res = await superAdminApi.syncTenants(user.id);
      if (res.tenantsAdded > 0) {
        alert(`Added ${user.email} to ${res.tenantsAdded} tenants.`);
        reload();
      } else {
        alert(`${user.email} is already a member of all ${res.totalTenants} tenants.`);
      }
    } catch (e: any) {
      alert(e?.message || "Failed to sync tenants");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="relative">
        <PageHeader
          title="Super Admins"
          subtitle="Manage global administrators who can access all tenants"
        />
        <div
          className="absolute right-0 top-0 h-full flex items-center gap-2 pr-1"
          style={{ zIndex: 5 }}
        >
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            New Super Admin
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4">
          {loading && <div className="text-sm text-secondary py-8 text-center">Loading super admins...</div>}
          {error && <div className="text-sm text-red-600 py-8 text-center">Error: {error}</div>}
          {!loading && !error && (
            <div className="overflow-hidden rounded border border-hairline">
              <table className="w-full text-sm">
                <thead className="text-secondary bg-surface-strong">
                  <tr>
                    <th className="text-left px-3 py-2">Email</th>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Verified</th>
                    <th className="text-left px-3 py-2">Tenants</th>
                    <th className="text-left px-3 py-2">Created</th>
                    <th className="text-right px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {superAdmins.map((user) => (
                    <tr key={user.id}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="break-all">{user.email}</span>
                          <span className="inline-flex items-center text-[10px] leading-4 px-1.5 py-0.5 rounded bg-[hsl(var(--brand-orange))]/20 border border-[hsl(var(--brand-orange))]/40 text-[hsl(var(--brand-orange))]">
                            Super Admin
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">{user.name || `${user.firstName} ${user.lastName}`.trim() || "—"}</td>
                      <td className="px-3 py-2">{user.verified ? "Yes" : "No"}</td>
                      <td className="px-3 py-2">{user.tenantCount}</td>
                      <td className="px-3 py-2">{fmtDate(user.createdAt)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => handleSync(user)}>
                            Sync Tenants
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRevoke(user)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Revoke
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {superAdmins.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-secondary">
                        No super admins found. Create one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <SectionCard title="About Super Admins" className="mx-4 mb-4">
          <div className="text-sm text-secondary space-y-2">
            <p>
              Super admins have global access across all tenants. They are automatically added as ADMIN members to every tenant.
            </p>
            <p>
              <strong>Key behaviors:</strong>
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>When a new super admin is created, they are added to ALL existing tenants</li>
              <li>When a new tenant is created, ALL super admins are automatically added to it</li>
              <li>Use "Sync Tenants" to manually add a super admin to any tenants they may be missing from</li>
              <li>Revoking super admin status does NOT remove their existing tenant memberships</li>
              <li>You cannot revoke your own super admin status or the last super admin</li>
            </ul>
          </div>
        </SectionCard>
      </Card>

      {/* Create Super Admin Modal */}
      {createOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !createWorking && !createdPassword && resetCreateModal()}
          />

          <div className="relative w-[540px] max-w-[92vw] rounded-xl border border-hairline bg-surface shadow-xl p-4">
            {!createdPassword ? (
              <>
                <div className="text-lg font-semibold mb-1">Create Super Admin</div>
                <div className="text-sm text-secondary mb-4">
                  Create a new super admin user who will have access to all tenants.
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-secondary mb-1">
                      Email <span className="text-[hsl(var(--brand-orange))]">*</span>
                    </div>
                    <Input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.currentTarget.value)}
                      placeholder="admin@breederhq.com"
                      type="email"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-secondary mb-1">
                        First name <span className="text-[hsl(var(--brand-orange))]">*</span>
                      </div>
                      <Input
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.currentTarget.value)}
                        placeholder="Jane"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-secondary mb-1">
                        Last name <span className="text-muted-foreground">(optional)</span>
                      </div>
                      <Input
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.currentTarget.value)}
                        placeholder="Smith"
                      />
                    </div>
                  </div>

                  <div className="border-t border-hairline pt-3 mt-3">
                    <div className="text-xs font-medium mb-2">Temporary Password</div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="gen-pwd-sa"
                        checked={generatePassword}
                        onChange={(e) => setGeneratePassword(e.currentTarget.checked)}
                        className="rounded"
                      />
                      <label htmlFor="gen-pwd-sa" className="text-sm cursor-pointer">
                        Generate strong password
                      </label>
                    </div>

                    {!generatePassword && (
                      <div>
                        <div className="text-xs text-secondary mb-1">
                          Enter password (min 8 chars) <span className="text-[hsl(var(--brand-orange))]">*</span>
                        </div>
                        <Input
                          type="password"
                          value={newTempPassword}
                          onChange={(e) => setNewTempPassword(e.currentTarget.value)}
                          placeholder="Temporary password"
                        />
                      </div>
                    )}
                  </div>

                  {createErr && <div className="text-sm text-red-600">{createErr}</div>}

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-secondary">
                      <span className="text-[hsl(var(--brand-orange))]">*</span> Required
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={resetCreateModal} disabled={createWorking}>
                        Cancel
                      </Button>
                      <Button onClick={doCreateSuperAdmin} disabled={!canCreate || createWorking}>
                        {createWorking ? "Creating..." : "Create Super Admin"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold mb-1 text-green-600">
                  Super Admin Created
                </div>
                <div className="text-sm text-secondary mb-4">
                  Copy the temporary password now. It will not be shown again.
                </div>

                <div className="space-y-3">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-xs text-secondary mb-1">Email</div>
                    <div className="font-mono text-sm">{newEmail}</div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="text-xs text-amber-700 dark:text-amber-300 mb-1 flex items-center justify-between">
                      <span>Temporary Password</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(createdPassword);
                        }}
                        className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded hover:bg-amber-100 dark:hover:bg-gray-700 text-amber-800 dark:text-amber-200"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="font-mono text-sm font-semibold break-all text-amber-900 dark:text-amber-100">{createdPassword}</div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs">
                    <div className="font-medium mb-1 text-blue-800 dark:text-blue-200">Important:</div>
                    <ul className="list-disc list-inside pl-2 space-y-1 text-blue-700 dark:text-blue-300">
                      <li>The user must change this password on first login</li>
                      <li>This password will not be shown again</li>
                      <li>The super admin has been added to all existing tenants</li>
                    </ul>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={resetCreateModal}>Done</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
