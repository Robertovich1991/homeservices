import type { ReactNode } from 'react'

export const Table = ({ head, children }: { head: string[]; children: ReactNode }) => (
  <div className="overflow-x-auto rounded-2xl border border-line bg-white">
    <table className="w-full min-w-[40rem] text-left text-sm">
      <thead className="border-b border-line bg-bg text-xs tracking-wide text-muted uppercase">
        <tr>
          {head.map((cell, index) => (
            <th key={cell || index} scope="col" className="px-4 py-3 font-bold">
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-line">{children}</tbody>
    </table>
  </div>
)

export const Td = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>
)
