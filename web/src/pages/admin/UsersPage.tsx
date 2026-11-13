import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../api/endpoints'
import type { Role, User, UserUpdateInput } from '../../api/types'
import Modal, { ConfirmDialog } from '../../components/Modal'
import { Button, ErrorState, FormError, PageHeader, SelectField, Spinner, TextField } from '../../components/ui'
import { useAuth } from '../../context/auth'
import { useLanguage } from '../../context/language'
import { errorText } from '../../i18n'
import { Table, Td } from './shared'
import { useAdminMutation, type Editing } from './useAdminMutation'

const ROLES: Role[] = ['dispatcher', 'admin']
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/

const UserFormModal = ({ user, onClose }: { user: User | null; onClose: () => void }) => {
  const { t } = useLanguage()
  const { user: currentUser } = useAuth()
  const isSelf = Boolean(user && user.id === currentUser?.id)
  const [username, setUsername] = useState(user?.username ?? '')
  const [name, setName] = useState(user?.name ?? '')
  const [role, setRole] = useState<Role>(user?.role ?? 'dispatcher')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const save = useAdminMutation(
    () => {
      if (!user) return api.createUser({ username: username.trim(), name: name.trim(), role, password })
      const changes: UserUpdateInput = {}
      if (name.trim() !== user.name) changes.name = name.trim()
      if (role !== user.role) changes.role = role
      if (password) changes.password = password
      return api.updateUser(user.id, changes)
    },
    { successMessage: t('common.saved'), onDone: onClose },
  )

  const handleSubmit = () => {
    if (!user && !USERNAME_PATTERN.test(username.trim())) {
      setLocalError(t('error.fieldInvalid', { field: t('field.username') }))
      return
    }
    if (!name.trim()) {
      setLocalError(t('error.fieldRequired', { field: t('admin.users.name') }))
      return
    }
    if ((!user || password) && password.length < 6) {
      setLocalError(t('admin.users.passwordHint'))
      return
    }
    if (user && name.trim() === user.name && role === user.role && !password) {
      onClose()
      return
    }
    setLocalError(null)
    save.mutate(undefined)
  }

  return (
    <Modal
      open
      title={user ? t('admin.users.edit') : t('admin.users.new')}
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
      <TextField
        label={t('admin.users.username')}
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        disabled={Boolean(user)}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={32}
        hint={user ? undefined : 'a-z, 0-9, . _ -'}
        required
        autoFocus={!user}
      />
      <TextField label={t('admin.users.name')} value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required autoFocus={Boolean(user)} />
      <SelectField
        label={t('admin.users.role')}
        value={role}
        onChange={(event) => setRole(event.target.value as Role)}
        disabled={isSelf}
        hint={isSelf ? t('error.selfAdmin') : undefined}
      >
        {ROLES.map((item) => (
          <option key={item} value={item}>
            {t(`role.${item}`)}
          </option>
        ))}
      </SelectField>
      <TextField
        label={user ? t('admin.users.passwordKeep') : t('admin.users.password')}
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="new-password"
        hint={t('admin.users.passwordHint')}
        minLength={6}
        maxLength={128}
        required={!user}
      />
      <FormError message={localError ?? save.error} />
    </Modal>
  )
}

const UsersPage = () => {
  const { t } = useLanguage()
  const { user: currentUser } = useAuth()
  const [editing, setEditing] = useState<Editing<User>>(null)
  const [deleting, setDeleting] = useState<User | null>(null)
  const query = useQuery({ queryKey: ['users'], queryFn: api.users })

  const remove = useAdminMutation((id: string) => api.deleteUser(id), {
    successMessage: t('common.deleted'),
    onDone: () => setDeleting(null),
  })
  const toggle = useAdminMutation((target: User) => api.updateUser(target.id, { disabled: !target.disabled }), {
    successMessage: t('common.saved'),
  })

  const renderTable = () => {
    if (query.isLoading) return <Spinner />
    if (query.error) return <ErrorState message={errorText(t, query.error)} onRetry={() => query.refetch()} />
    const users = [...(query.data ?? [])].sort((a, b) => a.username.localeCompare(b.username))
    return (
      <Table head={[t('admin.users.username'), t('admin.users.name'), t('admin.users.role'), t('admin.users.state'), t('common.actions')]}>
        {users.map((user) => {
          const isSelf = user.id === currentUser?.id
          return (
            <tr key={user.id}>
              <Td className="font-bold">
                {user.username}
                {isSelf ? <span className="ml-2 text-xs font-semibold text-muted">({t('admin.users.you')})</span> : null}
              </Td>
              <Td>{user.name}</Td>
              <Td>{t(`role.${user.role}`)}</Td>
              <Td>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.disabled ? 'bg-danger-bg text-danger' : 'bg-success-bg text-success'}`}>
                  {user.disabled ? t('admin.users.disabled') : t('admin.users.active')}
                </span>
              </Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setEditing({ mode: 'edit', item: user })} aria-label={`${t('common.edit')}: ${user.username}`}>
                    {t('common.edit')}
                  </Button>
                  {!isSelf ? (
                    <Button
                      variant="ghost"
                      onClick={() => toggle.mutate(user)}
                      busy={toggle.isPending && toggle.variables?.id === user.id}
                      aria-label={`${user.disabled ? t('admin.users.enable') : t('admin.users.disable')}: ${user.username}`}
                    >
                      {user.disabled ? t('admin.users.enable') : t('admin.users.disable')}
                    </Button>
                  ) : null}
                  {!isSelf ? (
                    <Button
                      variant="danger"
                      onClick={() => {
                        remove.clearError()
                        setDeleting(user)
                      }}
                      aria-label={`${t('common.delete')}: ${user.username}`}
                    >
                      {t('common.delete')}
                    </Button>
                  ) : null}
                </div>
              </Td>
            </tr>
          )
        })}
      </Table>
    )
  }

  return (
    <div>
      <PageHeader title={t('admin.users.title')} actions={<Button onClick={() => setEditing({ mode: 'create' })}>+ {t('admin.users.new')}</Button>} />
      <FormError message={toggle.error} />
      <div className="mt-2">{renderTable()}</div>
      {editing ? <UserFormModal user={editing.mode === 'edit' ? editing.item : null} onClose={() => setEditing(null)} /> : null}
      <ConfirmDialog
        open={Boolean(deleting)}
        title={t('admin.users.deleteTitle')}
        body={t('admin.users.deleteBody', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
        busy={remove.isPending}
        error={remove.error}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}

export default UsersPage
