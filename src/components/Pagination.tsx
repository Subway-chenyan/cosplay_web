import React from 'react'

interface PaginationProps {
    currentPage: number
    totalCount: number
    pageSize: number
    disabled?: boolean
    onPageChange: (page: number) => void
}

const Pagination = ({ currentPage, totalCount, pageSize, onPageChange, disabled = false }: PaginationProps) => {
    const totalPages = Math.ceil(totalCount / pageSize)

    if (totalPages <= 1) return null

    const getPageNumbers = () => {
        const selected = new Set([1, totalPages])
        for (let page = Math.max(1, currentPage - 2); page <= Math.min(totalPages, currentPage + 2); page++) selected.add(page)
        const pages: (number | string)[] = []
        const numbers = [...selected].sort((a, b) => a - b)
        numbers.forEach((page, index) => {
            if (index > 0 && page - numbers[index - 1] > 1) pages.push(`gap-${page}`)
            pages.push(page)
        })
        return pages
    }

    return (
        <nav aria-label="分页导航" className="flex flex-wrap justify-center items-center gap-2 my-8 font-sans font-bold">
            <button type="button"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={disabled || currentPage <= 1}
                className="px-4 py-2 bg-black text-white transform -skew-x-12 border-2 border-white hover:bg-p5-red disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black italic shadow-[2px_2px_0_0_black]"
            >
                <span className="transform skew-x-12 inline-block">上一页</span>
            </button>

            {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                    {typeof page === 'string' ? (
                        <span className="px-2 text-black font-black text-xl italic uppercase">...</span>
                    ) : (
                        <button type="button"
                            onClick={() => onPageChange(page as number)}
                            disabled={disabled || currentPage === page}
                            aria-label={`第 ${page} 页`}
                            aria-current={currentPage === page ? 'page' : undefined}
                            className={`
                w-10 h-10 flex items-center justify-center transform -skew-x-12 border-2 transition-all font-black
                ${currentPage === page
                                    ? 'bg-p5-red text-white border-white scale-110 shadow-[4px_4px_0_0_black]'
                                    : 'bg-white text-black border-black hover:bg-black hover:text-white'
                                }
              `}
                        >
                            <span className="transform skew-x-12 inline-block italic">{page}</span>
                        </button>
                    )}
                </React.Fragment>
            ))}

            <button type="button"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={disabled || currentPage >= totalPages}
                className="px-4 py-2 bg-black text-white transform -skew-x-12 border-2 border-white hover:bg-p5-red disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black italic shadow-[2px_2px_0_0_black]"
            >
                <span className="transform skew-x-12 inline-block">下一页</span>
            </button>
        </nav>
    )
}

export default Pagination
