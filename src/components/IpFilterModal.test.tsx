// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import IpFilterModal from './IpFilterModal'

afterEach(cleanup)

describe('IpFilterModal', () => {
  it('filters by category and supports multi-select', async () => {
    const onChange = vi.fn()
    render(<IpFilterModal open options={[
      { id: 'cn', name: '罗小黑战记', ip_category: '国漫', count: 2 },
      { id: 'jp', name: '火影忍者', ip_category: '日漫', count: 5 },
    ]} value={[]} onChange={onChange} onClose={vi.fn()} />)
    await userEvent.click(screen.getByRole('tab', { name: '国漫' }))
    expect(screen.getByRole('button', { name: /罗小黑战记/ })).not.toBeNull()
    expect(screen.queryByRole('button', { name: /火影忍者/ })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /罗小黑战记/ }))
    expect(onChange).toHaveBeenCalledWith([{ id: 'cn', name: '罗小黑战记', ip_category: '国漫', count: 2 }])
  })
})
