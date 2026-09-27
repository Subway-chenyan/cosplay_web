import { useEffect, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import { fetchGroups } from '../store/slices/groupsSlice'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import ClubCard from '../components/ClubCard'
import ChinaMapModule from '../components/ChinaMapModule'
import { Users, MapPin } from 'lucide-react'
import { parsePage } from '../features/serverFilters/query'

function GroupsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const currentPage = parsePage(params.get('page'))
  const query = params.get('q') || ''
  const selectedProvince = params.get('province') || ''
  const { groups, loading, error, pagination } = useSelector((state: RootState) => state.groups)
  const [inputValue, setInputValue] = useState(query)
  const displayGroups = groups
  useEffect(() => { setInputValue(query) }, [query])
  useEffect(() => {
    const request = dispatch(fetchGroups({ page: currentPage, search: query, province: selectedProvince }))
    return () => request.abort()
  }, [dispatch, currentPage, query, selectedProvince])
  const update = useCallback((changes: Record<string, string>) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key))
    if (next.toString() !== params.toString()) setParams(next, { state: { scrollTarget: 'group-results' } })
  }, [params, setParams])
  const handleInputChange = setInputValue
  const handleClearSearch = () => { setInputValue(''); update({ q: '', page: '' }) }
  const handleProvinceSelect = (province: string) => update({ province, page: '' })
  const clearProvinceFilter = () => update({ province: '', page: '' })
  const handleSearch = () => update({ q: inputValue.trim(), page: '' })

  const handleGroupClick = (groupId: string) => {
    navigate(`/group/${groupId}`)
  }

  if (loading && groups.length === 0) {
    return (
      <div data-route-loading="true" className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载社团...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div id="group-results" className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600">加载失败: {error}</p>
          <button type="button" className="mt-4 btn-primary" onClick={() => dispatch(fetchGroups({ page: currentPage, search: query, province: selectedProvince }))}>重新加载</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative group">
        <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-2 z-0"></div>
        <div className="relative z-10 bg-white border-4 border-black p-8 transform -skew-x-2">
          <div className="transform skew-x-2">
            <h1 className="text-3xl md:text-5xl font-black text-black mb-4 uppercase italic border-b-8 border-p5-red inline-block" style={{ textShadow: '4px 4px 0px #d90614' }}>
              社团档案
            </h1>
            <p className="block text-xl font-black italic bg-black text-white px-4 py-1 transform -skew-x-12 w-fit mb-8">
              搜集同步中
            </p>

            {/* Search Bar */}
            <div className="mt-8 max-w-3xl border-t-4 border-black border-dashed pt-8">
              <h2 className="text-xl font-black text-black italic mb-4">查找社团</h2>
              <SearchBar
                value={inputValue}
                onChange={handleInputChange}
                onClear={handleClearSearch}
                onSearch={handleSearch}
                placeholder="搜索名称、描述、地区..."
                className="max-w-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* China Map Module with P5 Frame */}
      <div className="relative p-6 bg-white border-4 border-black shadow-[12px_12px_0_0_black] overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 p5-halftone opacity-10 -rotate-45 translate-x-32 -translate-y-32"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-black italic mb-6 border-l-8 border-p5-red pl-4">
            社团分布地图
          </h2>
          <ChinaMapModule className="mb-0" onProvinceSelect={handleProvinceSelect} />
        </div>
      </div>

      {/* Province Filter Status */}
      {selectedProvince && (
        <div className="relative mb-12 group">
          <div className="absolute inset-0 bg-p5-red transform translate-x-2 translate-y-2 -skew-y-1 z-0 shadow-[8px_8px_0_0_black]"></div>
          <div className="relative z-10 bg-black border-4 border-white p-6 md:p-8 transform -skew-y-1 overflow-hidden">
            <div className="p5-halftone absolute inset-0 opacity-20 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 transform skew-y-1">
              <div className="flex items-center gap-6">
                <div className="bg-white p-4 transform rotate-12 border-4 border-p5-red">
                  <MapPin className="w-10 h-10 text-p5-red animate-bounce" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-p5-red italic tracking-tighter">已锁定地区：</span>
                  <h2 className="text-2xl md:text-5xl font-black text-white italic leading-none p5-text-shadow-red">
                    {selectedProvince} <span className="text-p5-red">/</span> {pagination.count} <span className="text-lg md:text-2xl">个社团</span>
                  </h2>
                </div>
              </div>

              <button
                onClick={clearProvinceFilter}
                className="bg-p5-red text-white px-8 py-3 font-black italic border-4 border-white hover:bg-white hover:text-black transition-all transform -skew-x-12 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] active:translate-y-1"
              >
                <span className="transform skew-x-12 inline-block">清除筛选</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Groups Grid */}
      <div id="group-results" data-route-loading={loading} aria-busy={loading} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayGroups.length > 0 ? (
          displayGroups.map((group: any) => (
            <ClubCard
              key={group.id}
              club={group}
              onClick={() => handleGroupClick(group.id)}
            />
          ))
        ) : (
          <div className="col-span-full">
            <div className="relative p-20 text-center group/no-results overflow-hidden">
              <div className="absolute inset-0 bg-black transform -skew-y-1 z-0 border-y-8 border-p5-red shadow-2xl"></div>
              <div className="p5-halftone absolute inset-0 opacity-10 pointer-events-none"></div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="bg-white p-6 transform rotate-12 border-4 border-black shadow-[8px_8px_0_0_#d90614] mb-8">
                  <Users className="w-20 h-20 text-black transform -rotate-12" />
                </div>
                <h3 className="text-4xl font-black text-white italic tracking-tighter mb-4" style={{ textShadow: '4px 4px 0px #d90614' }}>
                  未找到匹配社团
                </h3>
                <p className="bg-p5-red text-white px-8 py-2 font-black italic transform -skew-x-12 border-2 border-white">
                  当前条件下没有匹配结果
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalCount={pagination.count}
        pageSize={12}
        disabled={loading}
        onPageChange={(page) => {
          update({ page: page > 1 ? String(page) : '' })
        }}
      />

      {/* Total Count Display */}
      {groups.length > 0 && (
        <div className="text-center mt-12 mb-8">
          <div className="inline-block bg-black text-white px-6 py-1 transform -skew-x-12 border-2 border-p5-red shadow-[4px_4px_0_0_black]">
            <span className="transform skew-x-12 inline-block font-black italic tracking-tighter">
              已显示 <span className="text-p5-red">{groups.length}</span> / <span className="text-p5-red">{pagination.count}</span> 个社团
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupsPage
