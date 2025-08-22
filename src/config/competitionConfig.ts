// 比赛详情页配置类型定义
export interface CompetitionConfig {
  id: string
  banner: {
    backgroundImage?: string
    backgroundColor?: string
    gradientColors?: string[]
  }
  awards: {
    displayOrder?: string[] // 奖项ID的显示顺序
    customStyles?: {
      [awardId: string]: {
        color?: string
        textColor?: string
        borderColor?: string
        icon?: string
      }
    }
  }
  customSections?: {
    id: string
    title: string
    content: string
    position: 'before-awards' | 'after-awards' | 'before-videos' | 'after-videos'
    style?: {
      backgroundColor?: string
      textColor?: string
      borderColor?: string
    }
  }[]
}

// 默认配置
const defaultConfig: Partial<CompetitionConfig> = {
  banner: {
    gradientColors: ['from-yellow-400', 'via-orange-500', 'to-red-500']
  },
  awards: {
    displayOrder: [],
    customStyles: {}
  },
  customSections: []
}

// 比赛配置映射
const competitionConfigs: { [competitionId: string]: CompetitionConfig } = {
  // 示例配置
  'competition-1': {
    id: 'competition-1',
    banner: {
      backgroundImage: '/images/competitions/competition-1-banner.jpg',
      gradientColors: ['from-blue-400', 'via-purple-500', 'to-pink-500']
    },
    awards: {
      displayOrder: ['award-3', 'award-1', 'award-2'], // 自定义奖项显示顺序
      customStyles: {
        'award-1': {
          color: 'bg-gold-100',
          textColor: 'text-gold-700',
          borderColor: 'border-gold-200'
        }
      }
    },
    customSections: [
      {
        id: 'special-notice',
        title: '特别说明',
        content: '这是一个特殊的比赛，有特殊的规则和要求。',
        position: 'before-awards',
        style: {
          backgroundColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        }
      }
    ]
  }
}

// 获取比赛配置
export const getCompetitionConfig = (competitionId: string): CompetitionConfig => {
  const config = competitionConfigs[competitionId]
  if (!config) {
    return {
      id: competitionId,
      ...defaultConfig
    } as CompetitionConfig
  }
  
  // 合并默认配置和自定义配置
  return {
    ...defaultConfig,
    ...config,
    banner: {
      ...defaultConfig.banner,
      ...config.banner
    },
    awards: {
      ...defaultConfig.awards,
      ...config.awards,
      customStyles: {
        ...defaultConfig.awards?.customStyles,
        ...config.awards?.customStyles
      }
    },
    customSections: config.customSections || defaultConfig.customSections || []
  }
}

// 获取所有已配置的比赛ID
export const getConfiguredCompetitionIds = (): string[] => {
  return Object.keys(competitionConfigs)
}

// 添加或更新比赛配置
export const setCompetitionConfig = (competitionId: string, config: Partial<CompetitionConfig>) => {
  competitionConfigs[competitionId] = {
    ...defaultConfig,
    ...competitionConfigs[competitionId],
    ...config,
    id: competitionId
  } as CompetitionConfig
}

// 删除比赛配置
export const removeCompetitionConfig = (competitionId: string) => {
  delete competitionConfigs[competitionId]
}