// 中国地图GeoJSON数据
// 数据来源：阿里云DataV.GeoAtlas (https://datav.aliyun.com/portal/school/atlas/area_selector)
// 这里使用简化版本的中国地图数据，实际项目中建议从阿里云DataV下载完整数据

import { fullChinaGeoJSON } from './fullChinaGeoJSON';

export const chinaGeoJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "adcode": 110000,
        "name": "北京市",
        "center": [116.405285, 39.904989],
        "centroid": [116.419947, 39.906016],
        "childrenNum": 16,
        "level": "province",
        "parent": {
          "adcode": 100000
        },
        "subFeatureIndex": 0,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[116.0, 39.5], [117.0, 39.5], [117.0, 40.5], [116.0, 40.5], [116.0, 39.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 310000,
        "name": "上海市",
        "center": [121.472644, 31.231706],
        "centroid": [121.395736, 31.222888],
        "childrenNum": 16,
        "level": "province",
        "parent": {
          "adcode": 100000
        },
        "subFeatureIndex": 1,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[121.0, 31.0], [122.0, 31.0], [122.0, 32.0], [121.0, 32.0], [121.0, 31.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 440000,
        "name": "广东省",
        "center": [113.280637, 23.125178],
        "centroid": [113.429919, 23.334643],
        "childrenNum": 21,
        "level": "province",
        "parent": {
          "adcode": 100000
        },
        "subFeatureIndex": 2,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[113.0, 23.0], [115.0, 23.0], [115.0, 25.0], [113.0, 25.0], [113.0, 23.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 330000,
        "name": "浙江省",
        "center": [120.153576, 30.287459],
        "centroid": [120.498017, 29.344786],
        "childrenNum": 11,
        "level": "province",
        "parent": {
          "adcode": 100000
        },
        "subFeatureIndex": 3,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[120.0, 29.0], [122.0, 29.0], [122.0, 31.0], [120.0, 31.0], [120.0, 29.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 320000,
        "name": "江苏省",
        "center": [118.767413, 32.041544],
        "centroid": [119.368489, 32.648541],
        "childrenNum": 13,
        "level": "province",
        "parent": {
          "adcode": 100000
        },
        "subFeatureIndex": 4,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[118.0, 32.0], [120.0, 32.0], [120.0, 34.0], [118.0, 34.0], [118.0, 32.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 510000,
        "name": "四川省",
        "center": [104.065735, 30.659462],
        "centroid": [102.693453, 30.674545],
        "childrenNum": 21,
        "level": "province",
        "parent": {
          "adcode": 100000
        },
        "subFeatureIndex": 5,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[102.0, 30.0], [106.0, 30.0], [106.0, 33.0], [102.0, 33.0], [102.0, 30.0]]]
      }
    }
  ]
};

// 获取在线地图数据的函数
export const fetchChinaGeoJSON = async () => {
  try {
    // 尝试通过后端代理获取地图数据，避免跨域问题
    const response = await fetch('/api/map/china-geojson');
    if (response.ok) {
      const data = await response.json();
      console.log('成功获取完整地图数据');
      return data;
    }
  } catch (error) {
    console.warn('无法通过后端代理获取地图数据，尝试直接获取:', error);
  }
  
  try {
    // 备用方案：直接请求阿里云API（可能遇到跨域问题）
    const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json');
    if (response.ok) {
      const data = await response.json();
      console.log('成功获取在线地图数据');
      return data;
    }
  } catch (error) {
    console.warn('无法获取在线地图数据，使用本地简化数据:', error);
  }
  
  // 如果所有在线获取都失败，返回本地完整数据
  console.log('使用本地完整地图数据');
  return fullChinaGeoJSON;
};

// 省份名称映射（用于数据匹配）
export const provinceNameMap: { [key: string]: string } = {
  '北京': '北京市',
  '上海': '上海市',
  '广东': '广东省',
  '浙江': '浙江省',
  '江苏': '江苏省',
  '四川': '四川省',
  '天津': '天津市',
  '重庆': '重庆市',
  '河北': '河北省',
  '山西': '山西省',
  '内蒙古': '内蒙古自治区',
  '辽宁': '辽宁省',
  '吉林': '吉林省',
  '黑龙江': '黑龙江省',
  '安徽': '安徽省',
  '福建': '福建省',
  '江西': '江西省',
  '山东': '山东省',
  '河南': '河南省',
  '湖北': '湖北省',
  '湖南': '湖南省',
  '广西': '广西壮族自治区',
  '海南': '海南省',
  '贵州': '贵州省',
  '云南': '云南省',
  '西藏': '西藏自治区',
  '陕西': '陕西省',
  '甘肃': '甘肃省',
  '青海': '青海省',
  '宁夏': '宁夏回族自治区',
  '新疆': '新疆维吾尔自治区',
  '台湾': '台湾省',
  '香港': '香港特别行政区',
  '澳门': '澳门特别行政区'
};