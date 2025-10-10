// 比赛自定义配置
export interface CompetitionCustomConfig {
  // Banner背景图片配置
  bannerBackground?: {
    type: 'gradient' | 'image' | 'color'
    value: string // 渐变CSS、图片URL或颜色值
  }
  
  // 奖项排序配置
  awardOrder?: {
    // 奖项ID的排序数组，数组中的奖项会按顺序显示在前面
    priorityAwards: string[]
    // 排序规则：'custom' | 'alphabetical' | 'default'
    sortRule: 'custom' | 'alphabetical' | 'default'
  }
}

// 比赛自定义配置映射
export const competitionCustomConfigs: Record<string, CompetitionCustomConfig> = {
  // 中国国际动漫节COSPLAY超级盛典 - 粉色梦幻主题
  '35d864f0-f112-4bce-a4ec-a0a1886afc4f': {
    bannerBackground: {
      type: 'image',
      value: '/assets/guoman.jpg'
    },
    awardOrder: {
      priorityAwards: [],
      sortRule: 'default' // 使用默认权重排序
    }
  },
  
  // 第二个比赛 - 蓝绿渐变主题
  '1ab9ef24-924c-4a71-ae44-f94018671029': {
    bannerBackground: {
      type: 'image',
      value: '/assets/CJ2.png'
    },
    awardOrder: {
      priorityAwards: [],
      sortRule: 'default'
    }
  },
  
  // 第三个比赛 - 动漫主题背景图片
  '07f39591-83c9-4ce6-bd97-ee732b258976': {
    bannerBackground: {
      type: 'image',
      value: '/assets/JL2.png'
    },
    awardOrder: {
      priorityAwards: [],
      sortRule: 'default'
    }
  }
}

// 获取比赛自定义配置的工具函数
export const getCompetitionCustomConfig = (competitionId: string): CompetitionCustomConfig => {
  return competitionCustomConfigs[competitionId] || {}
}

// 获取默认banner背景
export const getDefaultBannerBackground = (): string => {
  return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
}

// 根据奖项名称生成默认排序权重
export const getAwardSortWeight = (awardName: string): number => {
  const name = awardName.toLowerCase()
  
  // 团体规模权重基数
  let baseWeight = 0
  if (name.includes('十五人以上') || name.includes('最佳团体组')) {
    baseWeight = 6000
  } else if (name.includes('十五人以下') || name.includes('最佳小团体组')) {
    baseWeight = 5000
  } else if (name.includes('盛龙') || name.includes('双人')) {
    baseWeight = 4000
  } else if (name.includes('单项') || name.includes('最佳') || name.includes('中国原创风格奖'))  {
    baseWeight = 3000
  } else if (name.includes('才艺组')) {
    baseWeight = 1000
  } else if (name.includes('剑网')) {
    baseWeight = 900
  } else if (name.includes('天涯明月刀')) {
    baseWeight = 800
  } else if (name.includes('倩女幽魂')) {
    baseWeight = 700
  } else if (name.includes('梦三国')) {
    baseWeight = 600
  }
  
  // 奖项等级权重
  let gradeWeight = 0
  if (name.includes('金') || name.includes('gold') || name.includes('一等奖')) {
    gradeWeight = 30
  } else if (name.includes('银') || name.includes('silver') || name.includes('二等奖')) {
    gradeWeight = 20
  } else if (name.includes('铜') || name.includes('bronze') || name.includes('三等奖')) {
    gradeWeight = 10
  } else if (name.includes('特别') || name.includes('special')) {
    gradeWeight = 8
  } else if (name.includes('最佳')) {
    gradeWeight = 6
  } else if (name.includes('优秀') || name.includes('优胜')) {
    gradeWeight = 4
  }
  
  // 如果没有团体规模信息，使用原有的权重规则
  if (baseWeight === 0) {
    if (name.includes('金') || name.includes('gold') || name.includes('一等奖')) {
      return 1000
    }
    if (name.includes('银') || name.includes('silver') || name.includes('二等奖')) {
      return 900
    }
    if (name.includes('铜') || name.includes('bronze') || name.includes('三等奖')) {
      return 800
    }
    if (name.includes('特别') || name.includes('special')) {
      return 700
    }
    if (name.includes('最佳')) {
      return 600
    }
    if (name.includes('优秀') || name.includes('优胜')) {
      return 500
    }
    return 100
  }
  
  // 返回组合权重
  return baseWeight + gradeWeight
}