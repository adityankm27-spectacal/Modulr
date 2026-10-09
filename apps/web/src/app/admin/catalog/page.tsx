import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { ActionForm, CheckboxField, TextField } from "@/components/admin/action-form";
import { AdminSection, Disclosure, EmptyState } from "@/components/admin/admin-ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";
import {
  deleteBranch,
  deleteCollege,
  deleteSyllabus,
  saveBranch,
  saveCollege,
  saveSyllabus,
} from "@/lib/admin/actions";
import { getCatalogTree } from "@/lib/admin/queries";
import { adminMetadata } from "@/lib/admin/metadata";

export const generateMetadata = adminMetadata("Catalog");

export default async function CatalogPage() {
  const colleges = await getCatalogTree();

  return (
    <>
      <div>
        <h1 className="text-3xl">Catalog</h1>
        <p className="mt-2 text-muted-foreground">
          College → branch → syllabus version. Open a syllabus version to manage its subjects and
          modules.
        </p>
      </div>

      {colleges.length === 0 ? (
        <EmptyState>No colleges yet. Add the first one below.</EmptyState>
      ) : null}

      {colleges.map((college) => (
        <section
          key={college.id}
          aria-label={college.name}
          className="space-y-4 rounded-3xl border-2 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-sans text-xl font-extrabold tracking-normal">{college.name}</h2>
              <p className="font-mono text-sm text-muted-foreground">{college.short_code}</p>
            </div>
            <div className="flex flex-wrap items-start gap-1">
              <Disclosure summary="Edit college">
                <ActionForm action={saveCollege}>
                  <input type="hidden" name="id" value={college.id} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField name="name" label="Name" defaultValue={college.name} />
                    <TextField
                      name="short_code"
                      label="Short code"
                      defaultValue={college.short_code}
                    />
                  </div>
                </ActionForm>
              </Disclosure>
              <DeleteButton
                action={deleteCollege}
                fields={{ id: college.id }}
                what={college.name}
              />
            </div>
          </div>

          <ul className="space-y-3">
            {college.branches.map((branch) => (
              <li key={branch.id} className="rounded-2xl bg-muted/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-bold">
                    {branch.name}{" "}
                    <span className="font-mono text-sm text-muted-foreground">{branch.code}</span>
                  </p>
                  <div className="flex flex-wrap items-start gap-1">
                    <Disclosure summary="Edit branch">
                      <ActionForm action={saveBranch}>
                        <input type="hidden" name="id" value={branch.id} />
                        <input type="hidden" name="college_id" value={college.id} />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextField name="name" label="Name" defaultValue={branch.name} />
                          <TextField name="code" label="Code" defaultValue={branch.code} />
                        </div>
                      </ActionForm>
                    </Disclosure>
                    <DeleteButton
                      action={deleteBranch}
                      fields={{ id: branch.id }}
                      what={`the ${branch.name} branch`}
                    />
                  </div>
                </div>

                <ul className="mt-3 space-y-2">
                  {branch.syllabus_versions.map((sv) => (
                    <li key={sv.id} className="rounded-xl border-2 bg-card p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/admin/syllabus/${sv.id}`}
                          className="inline-flex min-h-11 items-center gap-2 font-bold text-link"
                        >
                          {sv.label}
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          {sv.is_current ? <Badge variant="free">Current</Badge> : null}
                          {sv.subjects[0]?.count ?? 0} subjects
                        </span>
                      </div>
                      <div className="flex flex-wrap items-start gap-1">
                        <Disclosure summary="Edit">
                          <ActionForm action={saveSyllabus}>
                            <input type="hidden" name="id" value={sv.id} />
                            <input type="hidden" name="branch_id" value={branch.id} />
                            <TextField name="label" label="Label" defaultValue={sv.label} />
                            <CheckboxField
                              name="is_current"
                              label="Current syllabus for this branch"
                              defaultChecked={sv.is_current}
                            />
                          </ActionForm>
                        </Disclosure>
                        <DeleteButton
                          action={deleteSyllabus}
                          fields={{ id: sv.id }}
                          what={sv.label}
                        />
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-3">
                  <Disclosure
                    summary={
                      <>
                        <Plus className="size-4" aria-hidden="true" /> Add syllabus version
                      </>
                    }
                  >
                    <ActionForm action={saveSyllabus} submitLabel="Add" resetOnSuccess>
                      <input type="hidden" name="branch_id" value={branch.id} />
                      <TextField name="label" label="Label" placeholder="e.g. 2024 scheme" />
                      <CheckboxField name="is_current" label="Current syllabus for this branch" />
                    </ActionForm>
                  </Disclosure>
                </div>
              </li>
            ))}
          </ul>

          <Disclosure
            summary={
              <>
                <Plus className="size-4" aria-hidden="true" /> Add branch
              </>
            }
          >
            <ActionForm action={saveBranch} submitLabel="Add branch" resetOnSuccess>
              <input type="hidden" name="college_id" value={college.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="name" label="Name" placeholder="Information Technology" />
                <TextField name="code" label="Code" placeholder="IT" />
              </div>
            </ActionForm>
          </Disclosure>
        </section>
      ))}

      <AdminSection title="Add a college">
        <ActionForm
          action={saveCollege}
          submitLabel="Add college"
          resetOnSuccess
          className="max-w-xl"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="name" label="Name" />
            <TextField name="short_code" label="Short code" hint="Letters, numbers and dashes." />
          </div>
        </ActionForm>
      </AdminSection>
    </>
  );
}
