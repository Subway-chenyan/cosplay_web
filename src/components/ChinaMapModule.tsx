import React, { useRef, useEffect, useState } from 'react';
import * as echarts from 'echarts';
import { Search, MapPin } from 'lucide-react';
import { fetchChinaGeoJSON, provinceNameMap } from '../data/chinaGeoJSON';
import { groupService } from '../services/groupService';
import { Group } from '../types';

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
  const [, setSelectedProvince] = useState<string>('');
  const [, setSelectedClubs] = useState<Group[]>([]);
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
            // 获取该省份的社团详情，设置较大的page_size以获取所有社团
            const groupsResponse = await groupService.getGroupsByProvince(stat.province, {
              page_size: 100 // 设置较大的页面大小以获取更多社团
            });
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
            text: '全国社团情报图',
            left: 'center',
            top: '20px',
            textStyle: {
              color: '#000',
              fontSize: 24,
              fontWeight: '900',
              fontFamily: 'Bangers, cursive'
            }
          },
          tooltip: {
            trigger: 'item',
            formatter: function (params: any) {
              if (params.data) {
                return `
                  <div style="padding: 12px; background: #000; color: #fff; border: 2px solid #d90614; font-family: sans-serif;">
                    <div style="font-weight: 900; margin-bottom: 4px; color: #d90614; font-size: 16px; border-bottom: 1px solid #d90614;">${params.data.name}</div>
                    <div style="font-weight: bold;">社团数量: ${params.data.value}个</div>
                    <div style="color: #999; font-size: 10px; margin-top: 4px; font-style: italic;">CLICK TO INVESTIGATE / 点击查看详情</div>
                  </div>
                `;
              }
              return `<div style="padding: 8px; background: #000; color: #fff;">${params.name}<br/>INTEGRITY UNKNOWN / 暂无社团数据</div>`;
            },
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
            padding: 0
          },
          visualMap: {
            type: 'continuous',
            left: '5%',
            bottom: '10%',
            min: 0,
            max: maxValue,
            text: ['高', '低'],
            realtime: false,
            calculable: true,
            inRange: {
              color: ['#ffffff', '#ffccd2', '#ff808f', '#ff334d', '#d90614']
            },
            textStyle: {
              color: '#000',
              fontWeight: 'bold'
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
                  color: '#fff',
                  fontWeight: 'bold'
                },
                itemStyle: {
                  areaColor: '#000',
                  borderColor: '#d90614',
                  borderWidth: 2
                }
              },
              select: {
                label: {
                  show: true,
                  color: '#fff',
                  fontWeight: 'bold'
                },
                itemStyle: {
                  areaColor: '#d90614',
                  borderColor: '#000',
                  borderWidth: 2
                }
              },
              itemStyle: {
                borderColor: '#000',
                borderWidth: 1,
                areaColor: '#fff'
              },
              data: provinceData
            }
          ]
        };

        chart.setOption(option);

        // 添加点击事件监听
        chart.on('click', function (params: any) {
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
    <div className={`relative group ${className}`}>
      {/* 装饰性背景层 */}
      <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-1 z-0 shadow-lg"></div>

      <div className="relative z-10 bg-white border-4 border-black p-6 md:p-8 transform -skew-x-1 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-64 h-64 p5-halftone opacity-5 -rotate-45 translate-x-32 -translate-y-32"></div>

        {/* 头部 */}
        <div className="flex items-center justify-between mb-8 transform skew-x-1 border-b-4 border-black pb-4">
          <div className="flex items-center space-x-4">
            <div className="bg-p5-red p-3 transform rotate-12 border-2 border-black">
              <MapPin className="w-8 h-8 text-white transform -rotate-12" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-black uppercase italic tracking-tighter">OPERATIONAL MAP / 社团分布</h2>
              <p className="text-xs font-black text-p5-red uppercase italic">DEPLOYMENT STATUS BY REGION / 各地区部署状态</p>
            </div>
          </div>
        </div>

        <div className="relative transform skew-x-1">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm z-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-p5-red border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-lg font-black italic uppercase">Synchronizing... / 正在同步数据...</div>
              </div>
            </div>
          )}
          <div
            ref={mapRef}
            className="w-full h-96 lg:h-[550px] bg-white border-2 border-black"
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* 地图说明 & 统计 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 transform skew-x-1">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-black text-white p-4 transform -rotate-2 border-2 border-p5-red shadow-[4px_4px_0_0_black]">
              <div className="flex items-center gap-3 mb-2">
                <Search className="w-5 h-5 text-p5-red" />
                <span className="font-black italic uppercase text-xs">Tactical Intel / 使用说明</span>
              </div>
              <ul className="text-xs font-bold space-y-1 text-gray-300 italic">
                <li>• 点击省份查看社团详情 / CLICK FOR INTEL</li>
                <li>• 支持缩放与拖拽 / NAVIGATIONAL ZOOM</li>
              </ul>
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="relative group/stat">
              <div className="absolute inset-0 bg-p5-red transform translate-x-1 translate-y-1 -skew-x-6 z-0"></div>
              <div className="relative z-10 bg-black p-4 transform -skew-x-6 border-2 border-white flex flex-col items-center justify-center">
                <div className="text-3xl font-black text-white italic" style={{ textShadow: '2px 2px 0px #d90614' }}>
                  {Object.keys(clubData).length}
                </div>
                <div className="text-[10px] font-black text-p5-red uppercase italic">Provinces Secured / 覆盖省份</div>
              </div>
            </div>
            <div className="relative group/stat">
              <div className="absolute inset-0 bg-white transform translate-x-1 translate-y-1 -skew-x-6 z-0"></div>
              <div className="relative z-10 bg-black p-4 transform -skew-x-6 border-2 border-p5-red flex flex-col items-center justify-center">
                <div className="text-3xl font-black text-white italic" style={{ textShadow: '2px 2px 0px #d90614' }}>
                  {Object.values(clubData).reduce((sum, data) => sum + data.count, 0)}
                </div>
                <div className="text-[10px] font-black text-gray-400 uppercase italic">Active Alliances / 社团总数</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChinaMapModule;