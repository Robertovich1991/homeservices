import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../api/endpoints'
import type { Worker, WorkerInput } from '../../api/types'
import { useCategories } from '../../categories/useCategories'
import Modal, { ConfirmDialog } from '../../components/Modal'
import { Button, CategoryBadge, EmptyState, ErrorState, FormError, PageHeader, SelectField, Spinner, TextField } from '../../components/ui'
import { useLanguage } from '../../context/language'
import { errorText } from '../../i18n'
import { Table, Td } from './shared'
import { useAdminMutation, type Editing } from './useAdminMutation'

const WorkerFormModal = ({ worker, onClose }: { worker: Worker | null; onClose: () => void }) => {
  const { t } = useLanguage()
  const { categories, label } = useCategories()
  const [form, setForm] = useState<WorkerInput>({
    name: worker?.name ?? '',
    phone: worker?.phone ?? '',
    category: worker?.category ?? categories[0]?.id ?? '',
  })
  const [localError, setLocalError] = useState<string | null>(null)

  const save = useAdminMutation(
    (input: WorkerInput) => (worker ? api.updateWorker(worker.id, input) : api.createWorker(input)),
    { successMessage: t('common.saved'), onDone: onClose },
  )

  const handleSubmit = () => {
    const missing = (['name', 'phone', 'category'] as const).find((key) => !form[key].trim())
    if (missing) {
      setLocalError(t('error.fieldRequired', { field: t(`field.${missing}`) }))
      return
    }
    setLocalError(null)
    save.mutate({ name: form.name.trim(), phone: form.phone.trim(), category: form.category })
  }

  return (
    <Modal
      open
      title={worker ? t('admin.workers.edit') : t('admin.workers.new')}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" busy={save.isPending}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <TextField label={t('field.name')} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={100} required autoFocus />
      <TextField
        label={t('field.phone')}
        type="tel"
        value={form.phone}
        onChange={(event) => setForm({ ...form, phone: event.target.value })}
        placeholder="+374 91 000 000"
        required
      />
      <SelectField label={t('field.category')} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {label(category.id)}
          </option>
        ))}
      </SelectField>
      <FormError message={localError ?? save.error} />
    </Modal>
  )
}

const WorkersPage = () => {
  const { t } = useLanguage()
  const { categories, label } = useCategories()
  const [editing, setEditing] = useState<Editing<Worker>>(null)
  const [deleting, setDeleting] = useState<Worker | null>(null)
  const query = useQuery({ queryKey: ['workers', {}], queryFn: () => api.workers() })
  const remove = useAdminMutation((id: string) => api.deleteWorker(id), {
    successMessage: t('common.deleted'),
    onDone: () => setDeleting(null),
  })

  const renderTable = () => {
    if (query.isLoading) return <Spinner />
    if (query.error) return <ErrorState message={errorText(t, query.error)} onRetry={() => query.refetch()} />
    const workers = [...(query.data ?? [])].sort((a, b) => label(a.category).localeCompare(label(b.category)) || a.name.localeCompare(b.name))
    if (workers.length === 0) return <EmptyState>{t('admin.workers.empty')}</EmptyState>
    return (
      <Table head={[t('field.name'), t('field.phone'), t('field.category'), t('common.actions')]}>
        {workers.map((worker) => (
          <tr key={worker.id}>
            <Td className="font-bold">{worker.name}</Td>
            <Td>
              <a href={`tel:${worker.phone.replace(/[^+\d]/g, '')}`} className="text-primary hover:underline">
                {worker.phone}
              </a>
            </Td>
            <Td>
              <CategoryBadge category={worker.category} />
            </Td>
            <Td>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditing({ mode: 'edit', item: worker })} aria-label={`${t('common.edit')}: ${worker.name}`}>
                  {t('common.edit')}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    remove.clearError()
                    setDeleting(worker)
                  }}
                  aria-label={`${t('common.delete')}: ${worker.name}`}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('admin.workers.title')}
        actions={
          <Button onClick={() => setEditing({ mode: 'create' })} disabled={categories.length === 0}>
            + {t('admin.workers.new')}
          </Button>
        }
      />
      {renderTable()}
      {editing ? <WorkerFormModal worker={editing.mode === 'edit' ? editing.item : null} onClose={() => setEditing(null)} /> : null}
      <ConfirmDialog
        open={Boolean(deleting)}
        title={t('admin.workers.deleteTitle')}
        body={t('admin.workers.deleteBody', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
        busy={remove.isPending}
        error={remove.error}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}

export default WorkersPage
