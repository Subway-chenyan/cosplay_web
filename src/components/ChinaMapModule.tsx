import React, { useRef, useEffect, useState } from 'react';
import * as echarts from 'echarts';
import { Search, MapPin, Users } from 'lucide-react';
import { fetchChinaGeoJSON, provinceNameMap } from '../data/chinaGeoJSON';
import { groupService } from '../services/groupService';
import { ProvinceStats, Group } from '../types';

interface ClubData {
  [province: string]: {
    count: number;
    clubs: Group[];
  };
}





interface ChinaMapModuleProps {
  className?: string;
  onProvinceSelect?: (province: string, groups: Group[]) => void;
}

const ChinaMapModule: React.FC<ChinaMapModuleProps> = ({ className = '', onProvinceSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedClubs, setSelectedClubs] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clubData, setClubData] = useState<ClubData>({});
  const [error, setError] = useState<string | null>(null);

  // 获取省份统计数据
  useEffect(() => {
    const fetchProvinceData = async () => {
      try {
        setIsLoading(true);
        const response = await groupService.getProvinceStats();
        
        // 转换数据格式
        const transformedData: ClubData = {};
        
        for (const stat of response.province_stats) {
          if (stat.province) {
            // 获取该省份的社团详情
            const groupsResponse = await groupService.getGroupsByProvince(stat.province);
            transformedData[stat.province] = {
              count: stat.count,
              clubs: groupsResponse.results
            };
          }
        }
        
        setClubData(transformedData);
      } catch (err) {
        console.error('获取省份数据失败:', err);
        setError('获取数据失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProvinceData();
  }, []);

  useEffect(() => {
    if (!mapRef.current || isLoading || Object.keys(clubData).length === 0) return;

    const initMap = async () => {
      // 初始化ECharts实例
      const chart = echarts.init(mapRef.current!);
      chartRef.current = chart;

      try {
        // 获取中国地图GeoJSON数据
        const geoData = await fetchChinaGeoJSON();
        
        // 注册中国地图
        echarts.registerMap('china', geoData);
        
        const provinceData = Object.entries(clubData).map(([province, data]) => ({
          name: province, // API返回的已经是完整省份名称，直接使用
          value: data.count,
          clubs: data.clubs
        }));
        const maxValue = Math.max(...provinceData.map(item => item.value), 1);

        const option = {
          title: {
            text: '全国COSPLAY社团分布图',
            left: 'center',
            top: '20px',
            textStyle: {
              color: '#333',
              fontSize: 18,
              fontWeight: 'bold'
            }
          },
          tooltip: {
            trigger: 'item',
            formatter: function(params: any) {
              if (params.data) {
                return `
                  <div style="padding: 8px;">
                    <div style="font-weight: bold; margin-bottom: 4px;">${params.data.name}</div>
                    <div>社团数量: ${params.data.value}个</div>
                    <div style="color: #666; font-size: 12px; margin-top: 4px;">点击查看详情</div>
                  </div>
                `;
              }
              return `${params.name}<br/>暂无社团数据`;
            },
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#ddd',
            borderWidth: 1,
            textStyle: {
              color: '#333'
            }
          },
          visualMap: {
            type: 'continuous',
            left: 'left',
            min: 0,
            max: maxValue,
            text: ['多', '少'],
            realtime: false,
            calculable: true,
            inRange: {
              color: ['#e5f7ff', '#b3e0ff', '#66c7ff', '#1890ff', '#0066cc']
            },
            textStyle: {
              color: '#333'
            }
          },
          series: [
            {
              name: '社团数量',
              type: 'map',
              map: 'china',
              roam: true,
              zoom: 1.2,
              scaleLimit: {
                min: 0.8,
                max: 3
              },
              emphasis: {
                label: {
                  show: true,
                  color: '#fff'
                },
                itemStyle: {
                  areaColor: '#ff6b35',
                  borderColor: '#fff',
                  borderWidth: 2
                }
              },
              select: {
                label: {
                  show: true,
                  color: '#fff'
                },
                itemStyle: {
                  areaColor: '#ff6b35'
                }
              },
              itemStyle: {
                borderColor: '#fff',
                borderWidth: 1,
                areaColor: '#f0f9ff'
              },
              data: provinceData
            }
          ]
        };

        chart.setOption(option);

        // 添加点击事件监听
        chart.on('click', function(params: any) {
          const provinceName = params.name;
          const data = Object.entries(clubData).find(([key]) => 
            provinceNameMap[key] === provinceName || key === provinceName
          );
          if (data) {
            setSelectedProvince(data[0]);
            setSelectedClubs(data[1].clubs);
            // 通知父组件省份被选中
            onProvinceSelect?.(data[0], data[1].clubs);
          } else {
            setSelectedProvince(provinceName);
            setSelectedClubs([]);
            // 通知父组件省份被选中（无数据）
            onProvinceSelect?.(provinceName, []);
          }
        });

        // 响应式处理
        const handleResize = () => {
          chart.resize();
        };
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          chart.dispose();
        };
      } catch (error) {
        console.error('地图初始化失败:', error);
        setError('地图初始化失败');
      }
    };

    initMap();
  }, [clubData, isLoading]);

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-gray-500">地图加载中...</div>
          </div>
        )}
        <div 
          ref={mapRef} 
          className="w-full h-96 lg:h-[500px] rounded-lg border border-gray-200"
          style={{ minHeight: '400px' }}
        />
      </div>
      
      {/* 地图说明 */}
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>点击省份查看该地区社团详情</span>
          </div>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>支持地图缩放和拖拽</span>
          </div>
        </div>
      </div>
      
      {/* 统计信息 */}
      <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">全国统计</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(clubData).length}
            </div>
            <div className="text-gray-600">覆盖省份</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(clubData).reduce((sum, data) => sum + data.count, 0)}
            </div>
            <div className="text-gray-600">社团总数</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChinaMapModule;