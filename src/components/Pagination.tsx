import React from 'react'

interface PaginationProps {
    currentPage: number
    totalCount: number
    pageSize: number
    onPageChange: (page: number) => void
}

const Pagination = ({ currentPage, totalCount, pageSize, onPageChange }: PaginationProps) => {
    const totalPages = Math.ceil(totalCount / pageSize)

    if (totalPages <= 1) return null

    const getPageNumbers = () => {
        const pages = []
        const delta = 2

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - delta && i <= currentPage + delta)
            ) {
                pages.push(i)
            } else if (
                (i === currentPage - delta - 1) ||
                (i === currentPage + delta + 1)
            ) {
                pages.push('...')
            }
        }

        // De-dupe and filter '...'
        return [...new Set(pages)]
    }

    return (
        <div className="flex justify-center items-center space-x-2 my-8 font-sans font-bold">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-black text-white transform -skew-x-12 border-2 border-white hover:bg-p5-red disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black italic shadow-[2px_2px_0_0_black]"
            >
                <span className="transform skew-x-12 inline-block">上一页 / PREV</span>
            </button>

            {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                    {page === '...' ? (
                        <span className="px-2 text-black font-black text-xl italic uppercase">...</span>
                    ) : (
                        <button
                            onClick={() => onPageChange(page as number)}
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

            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-black text-white transform -skew-x-12 border-2 border-white hover:bg-p5-red disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black italic shadow-[2px_2px_0_0_black]"
            >
                <span className="transform skew-x-12 inline-block">下一页 / NEXT</span>
            </button>
        </div>
    )
}

export default Pagination
