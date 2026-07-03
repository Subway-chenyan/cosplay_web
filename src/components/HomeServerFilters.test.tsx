// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AsyncMultiSelect, { type AsyncSelectOption } from './AsyncMultiSelect'
import HomeServerFilters from './HomeServerFilters'


afterEach(cleanup)

describe('HomeServerFilters', () => {
  it('keeps changes as a draft until Apply is clicked', async () => {
    const onApply = vi.fn()
    const onClear = vi.fn()
    render(
      <HomeServerFilters
        value={{
          query: '原神',
          competitionIds: [],
          groupIds: [],
          page: 1,
        }}
        years={[{ value: 2025, count: 8 }]}
        competitionOptions={[]}
        groupOptions={[]}
        loadCompetitions={async () => []}
        loadGroups={async () => []}
        onApply={onApply}
        onClear={onClear}
      />,
    )

    fireEvent.change(screen.getByLabelText('年份'), { target: { value: '2025' } })
    expect(onApply).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: '应用筛选' }))
    expect(onApply).toHaveBeenCalledWith({
      query: '原神',
      year: 2025,
      competitionIds: [],
      groupIds: [],
      page: 1,
    })

    await userEvent.click(screen.getByRole('button', { name: '清空筛选' }))
    expect(onClear).toHaveBeenCalledOnce()
  })
})

describe('AsyncMultiSelect', () => {
  it('loads server options and preserves the selected option', async () => {
    const option: AsyncSelectOption = { id: 'competition-id', name: '主比赛' }
    const onChange = vi.fn()
    const loadOptions = vi.fn(async (query: string) => (
      query === '主' ? [option] : []
    ))

    render(
      <AsyncMultiSelect
        label="比赛"
        value={[]}
        loadOptions={loadOptions}
        onChange={onChange}
      />,
    )

    await userEvent.type(screen.getByLabelText('搜索比赛'), '主')
    await waitFor(() => expect(loadOptions).toHaveBeenCalledWith('主', expect.any(AbortSignal)))
    await userEvent.click(await screen.findByRole('button', { name: '选择主比赛' }))
    expect(onChange).toHaveBeenCalledWith([option])
  })
})
