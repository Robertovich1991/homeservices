import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../api/endpoints'
import type { Category, CategoryInput } from '../../api/types'
import { useCategories } from '../../categories/useCategories'
import Modal, { ConfirmDialog } from '../../components/Modal'
import { Button, EmptyState, ErrorState, FormError, PageHeader, Spinner, TextField } from '../../components/ui'
import { useLanguage } from '../../context/language'
import { errorText } from '../../i18n'
import { Table, Td } from './shared'
import { useAdminMutation, type Editing } from './useAdminMutation'

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

const CategoryFormModal = ({ category, onClose }: { category: Category | null; onClose: () => void }) => {
  const { t } = useLanguage()
  const [names, setNames] = useState(category?.names ?? { en: '', ru: '', de: '' })
  const [color, setColor] = useState(category?.color ?? '#1F6F8B')
  const [localError, setLocalError] = useState<string | null>(null)

  const save = useAdminMutation(
    (input: CategoryInput) => (category ? api.updateCategory(category.id, input) : api.createCategory(input)),
    { successMessage: t('common.saved'), onDone: onClose },
  )

  const handleSubmit = () => {
    if (!names.en.trim()) {
      setLocalError(t('error.fieldRequired', { field: t('admin.categories.nameEn') }))
      return
    }
    if (!HEX_COLOR.test(color)) {
      setLocalError(t('error.fieldInvalid', { field: t('admin.categories.color') }))
      return
    }
    setLocalError(null)
    save.mutate({ names: { en: names.en.trim(), ru: names.ru.trim(), de: names.de.trim() }, color })
  }

  return (
    <Modal
      open
      title={category ? t('admin.categories.edit') : t('admin.categories.new')}
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
      <TextField label={t('admin.categories.nameEn')} value={names.en} onChange={(event) => setNames({ ...names, en: event.target.value })} maxLength={40} required autoFocus />
      <TextField
        label={`${t('admin.categories.nameRu')} (${t('common.optional')})`}
        value={names.ru}
        onChange={(event) => setNames({ ...names, ru: event.target.value })}
        hint={t('admin.categories.fallbackHint')}
        maxLength={40}
      />
      <TextField
        label={`${t('admin.categories.nameDe')} (${t('common.optional')})`}
        value={names.de}
        onChange={(event) => setNames({ ...names, de: event.target.value })}
        hint={t('admin.categories.fallbackHint')}
        maxLength={40}
      />
      <div className="grid grid-cols-[auto_1fr] items-end gap-3">
        <TextField label={t('admin.categories.color')} type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-line bg-white p-1" />
        <TextField label="HEX" value={color} onChange={(event) => setColor(event.target.value)} maxLength={7} spellCheck={false} />
      </div>
      <FormError message={localError ?? save.error} />
    </Modal>
  )
}

const CategoriesPage = () => {
  const { t } = useLanguage()
  const { categories, isLoading, error } = useCategories()
  const [editing, setEditing] = useState<Editing<Category>>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const orders = useQuery({ queryKey: ['orders', {}], queryFn: () => api.orders() })
  const workers = useQuery({ queryKey: ['workers', {}], queryFn: () => api.workers() })
  const remove = useAdminMutation((id: string) => api.deleteCategory(id), {
    successMessage: t('common.deleted'),
    onDone: () => setDeleting(null),
  })

  const usage = (id: string) => ({
    orders: (orders.data ?? []).filter((order) => order.category === id).length,
    workers: (workers.data ?? []).filter((worker) => worker.category === id).length,
  })

  const renderTable = () => {
    if (isLoading) return <Spinner />
    if (error) return <ErrorState message={errorText(t, error)} />
    if (categories.length === 0) return <EmptyState>{t('orders.empty')}</EmptyState>
    return (
      <Table head={[t('admin.categories.color'), t('admin.categories.nameEn'), t('admin.categories.nameRu'), t('admin.categories.nameDe'), t('admin.categories.usageHeader'), t('common.actions')]}>
        {categories.map((category) => (
          <tr key={category.id}>
            <Td>
              <span className="inline-block size-6 rounded-full border border-line" style={{ backgroundColor: category.color }} aria-label={category.color} role="img" />
            </Td>
            <Td className="font-bold">{category.names.en}</Td>
            <Td>{category.names.ru}</Td>
            <Td>{category.names.de}</Td>
            <Td className="text-xs whitespace-nowrap text-muted">{t('admin.categories.usage', usage(category.id))}</Td>
            <Td>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditing({ mode: 'edit', item: category })} aria-label={`${t('common.edit')}: ${category.names.en}`}>
                  {t('common.edit')}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    remove.clearError()
                    setDeleting(category)
                  }}
                  aria-label={`${t('common.delete')}: ${category.names.en}`}
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
      <PageHeader title={t('admin.categories.title')} actions={<Button onClick={() => setEditing({ mode: 'create' })}>+ {t('admin.categories.new')}</Button>} />
      {renderTable()}
      {editing ? <CategoryFormModal category={editing.mode === 'edit' ? editing.item : null} onClose={() => setEditing(null)} /> : null}
      <ConfirmDialog
        open={Boolean(deleting)}
        title={t('admin.categories.deleteTitle')}
        body={t('admin.categories.deleteBody', { name: deleting?.names.en ?? '' })}
        confirmLabel={t('common.delete')}
        busy={remove.isPending}
        error={remove.error}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}

export default CategoriesPage
