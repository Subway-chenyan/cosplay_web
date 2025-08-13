// 完整的中国地图GeoJSON数据
// 这是一个简化但包含所有省份的地图数据，用作备用方案

export const fullChinaGeoJSON = {
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
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 0,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[116.0, 39.5], [117.5, 39.5], [117.5, 41.0], [116.0, 41.0], [116.0, 39.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 120000,
        "name": "天津市",
        "center": [117.190182, 39.125596],
        "centroid": [117.347043, 39.288036],
        "childrenNum": 16,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 1,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[117.0, 38.8], [118.0, 38.8], [118.0, 40.0], [117.0, 40.0], [117.0, 38.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 130000,
        "name": "河北省",
        "center": [114.502461, 38.045474],
        "centroid": [115.484943, 39.079467],
        "childrenNum": 11,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 2,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[113.5, 36.0], [119.5, 36.0], [119.5, 42.5], [113.5, 42.5], [113.5, 36.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 140000,
        "name": "山西省",
        "center": [112.549248, 37.857014],
        "centroid": [112.297134, 37.696495],
        "childrenNum": 11,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 3,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[110.5, 34.5], [114.5, 34.5], [114.5, 40.5], [110.5, 40.5], [110.5, 34.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 150000,
        "name": "内蒙古自治区",
        "center": [111.670801, 40.818311],
        "centroid": [114.177871, 43.328854],
        "childrenNum": 12,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 4,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[97.0, 37.5], [126.0, 37.5], [126.0, 53.0], [97.0, 53.0], [97.0, 37.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 210000,
        "name": "辽宁省",
        "center": [123.429096, 41.796767],
        "centroid": [122.604394, 41.299712],
        "childrenNum": 14,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 5,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[118.5, 38.5], [125.5, 38.5], [125.5, 43.5], [118.5, 43.5], [118.5, 38.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 220000,
        "name": "吉林省",
        "center": [125.3245, 43.886841],
        "centroid": [126.171208, 43.703954],
        "childrenNum": 9,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 6,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[121.5, 41.0], [131.0, 41.0], [131.0, 46.5], [121.5, 46.5], [121.5, 41.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 230000,
        "name": "黑龙江省",
        "center": [126.642464, 45.756967],
        "centroid": [127.693027, 47.315288],
        "childrenNum": 13,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 7,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[121.0, 43.5], [135.0, 43.5], [135.0, 53.5], [121.0, 53.5], [121.0, 43.5]]]
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
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 8,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[121.0, 30.8], [122.0, 30.8], [122.0, 31.8], [121.0, 31.8], [121.0, 30.8]]]
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
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 9,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[116.5, 30.5], [122.0, 30.5], [122.0, 35.0], [116.5, 35.0], [116.5, 30.5]]]
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
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 10,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[118.0, 27.0], [123.0, 27.0], [123.0, 31.5], [118.0, 31.5], [118.0, 27.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 340000,
        "name": "安徽省",
        "center": [117.283042, 31.86119],
        "centroid": [117.226297, 32.157142],
        "childrenNum": 16,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 11,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[114.5, 29.5], [119.5, 29.5], [119.5, 34.5], [114.5, 34.5], [114.5, 29.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 350000,
        "name": "福建省",
        "center": [119.306239, 26.075302],
        "centroid": [118.506008, 25.982814],
        "childrenNum": 9,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 12,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[115.5, 23.5], [120.5, 23.5], [120.5, 28.5], [115.5, 28.5], [115.5, 23.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 360000,
        "name": "江西省",
        "center": [115.892151, 28.676493],
        "centroid": [115.740506, 27.63481],
        "childrenNum": 11,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 13,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[113.5, 24.5], [118.5, 24.5], [118.5, 30.0], [113.5, 30.0], [113.5, 24.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 370000,
        "name": "山东省",
        "center": [117.000923, 36.675807],
        "centroid": [118.186255, 36.065676],
        "childrenNum": 16,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 14,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[114.5, 34.5], [122.5, 34.5], [122.5, 38.5], [114.5, 38.5], [114.5, 34.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 410000,
        "name": "河南省",
        "center": [113.665412, 34.757975],
        "centroid": [113.619717, 33.902648],
        "childrenNum": 18,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 15,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[110.0, 31.5], [116.5, 31.5], [116.5, 36.5], [110.0, 36.5], [110.0, 31.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 420000,
        "name": "湖北省",
        "center": [114.298572, 30.584355],
        "centroid": [112.271301, 31.13691],
        "childrenNum": 17,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 16,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[108.0, 29.0], [116.5, 29.0], [116.5, 33.5], [108.0, 33.5], [108.0, 29.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 430000,
        "name": "湖南省",
        "center": [112.982279, 28.19409],
        "centroid": [111.711649, 27.624629],
        "childrenNum": 14,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 17,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[108.5, 24.5], [114.5, 24.5], [114.5, 30.5], [108.5, 30.5], [108.5, 24.5]]]
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
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 18,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[109.5, 20.0], [117.5, 20.0], [117.5, 25.5], [109.5, 25.5], [109.5, 20.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 450000,
        "name": "广西壮族自治区",
        "center": [108.320004, 22.82402],
        "centroid": [108.79726, 23.833381],
        "childrenNum": 14,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 19,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[104.0, 20.5], [112.0, 20.5], [112.0, 26.5], [104.0, 26.5], [104.0, 20.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 460000,
        "name": "海南省",
        "center": [110.33119, 20.031971],
        "centroid": [109.754859, 19.189767],
        "childrenNum": 19,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 20,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[108.5, 18.0], [111.5, 18.0], [111.5, 20.5], [108.5, 20.5], [108.5, 18.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 500000,
        "name": "重庆市",
        "center": [106.504962, 29.533155],
        "centroid": [107.7539, 29.86],
        "childrenNum": 38,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 21,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[105.5, 28.0], [110.0, 28.0], [110.0, 32.0], [105.5, 32.0], [105.5, 28.0]]]
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
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 22,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[97.0, 26.0], [108.5, 26.0], [108.5, 34.0], [97.0, 34.0], [97.0, 26.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 520000,
        "name": "贵州省",
        "center": [106.713478, 26.578343],
        "centroid": [106.880455, 26.826368],
        "childrenNum": 9,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 23,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[103.5, 24.5], [109.5, 24.5], [109.5, 29.0], [103.5, 29.0], [103.5, 24.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 530000,
        "name": "云南省",
        "center": [102.712251, 25.040609],
        "centroid": [101.485106, 25.008643],
        "childrenNum": 16,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 24,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[97.0, 21.0], [106.0, 21.0], [106.0, 29.0], [97.0, 29.0], [97.0, 21.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 540000,
        "name": "西藏自治区",
        "center": [91.132212, 29.660361],
        "centroid": [88.388277, 31.56375],
        "childrenNum": 7,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 25,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[78.0, 26.5], [99.0, 26.5], [99.0, 36.5], [78.0, 36.5], [78.0, 26.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 610000,
        "name": "陕西省",
        "center": [108.948024, 34.263161],
        "centroid": [108.887114, 35.263661],
        "childrenNum": 10,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 26,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[105.5, 31.5], [111.0, 31.5], [111.0, 39.5], [105.5, 39.5], [105.5, 31.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 620000,
        "name": "甘肃省",
        "center": [103.823557, 36.058039],
        "centroid": [100.454951, 36.966105],
        "childrenNum": 14,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 27,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[92.0, 32.0], [109.0, 32.0], [109.0, 42.5], [92.0, 42.5], [92.0, 32.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 630000,
        "name": "青海省",
        "center": [101.778916, 36.623178],
        "centroid": [96.043533, 35.726403],
        "childrenNum": 8,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 28,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[89.0, 31.5], [103.0, 31.5], [103.0, 39.5], [89.0, 39.5], [89.0, 31.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 640000,
        "name": "宁夏回族自治区",
        "center": [106.278179, 38.46637],
        "centroid": [106.169866, 37.291332],
        "childrenNum": 5,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 29,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[104.0, 35.0], [107.5, 35.0], [107.5, 39.5], [104.0, 39.5], [104.0, 35.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 650000,
        "name": "新疆维吾尔自治区",
        "center": [87.617733, 43.792818],
        "centroid": [85.294711, 41.371801],
        "childrenNum": 24,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 30,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[73.0, 34.0], [96.5, 34.0], [96.5, 49.0], [73.0, 49.0], [73.0, 34.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 710000,
        "name": "台湾省",
        "center": [121.509062, 25.044332],
        "centroid": [120.971485, 23.749452],
        "childrenNum": 22,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 31,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[119.5, 21.5], [122.5, 21.5], [122.5, 25.5], [119.5, 25.5], [119.5, 21.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 810000,
        "name": "香港特别行政区",
        "center": [114.173355, 22.320048],
        "centroid": [114.134357, 22.377366],
        "childrenNum": 18,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 32,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[113.8, 22.1], [114.5, 22.1], [114.5, 22.6], [113.8, 22.6], [113.8, 22.1]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 820000,
        "name": "澳门特别行政区",
        "center": [113.54909, 22.198951],
        "centroid": [113.566988, 22.159307],
        "childrenNum": 8,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 33,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[113.5, 22.1], [113.6, 22.1], [113.6, 22.3], [113.5, 22.3], [113.5, 22.1]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "adcode": 100000,
        "name": "南海诸岛",
        "center": [116.0, 15.0],
        "centroid": [116.0, 15.0],
        "childrenNum": 0,
        "level": "province",
        "parent": { "adcode": 100000 },
        "subFeatureIndex": 34,
        "acroutes": [100000]
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[109.0, 3.0], [118.0, 3.0], [118.0, 23.0], [109.0, 23.0], [109.0, 3.0]]]
      }
    }
  ]
};