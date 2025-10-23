"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  Zap,
  Thermometer,
  Eye,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  Hash,
  Camera,
  Download,
  RefreshCw,
  Shield,
  Target,
} from "lucide-react";

export default function PanelDetailPage({ params }) {
  const [panel, setPanel] = useState(null);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScanType, setSelectedScanType] = useState('EL');

  useEffect(() => {
    fetchPanelDetails();
  }, [params.id]);

  const fetchPanelDetails = async () => {
    try {
      // Mock data for now since we don't have detailed panel API yet
      const mockPanel = {
        id: params.id,
        serial_number: `HSN-240924-${String(params.id).padStart(3, '0')}`,
        production_line_name: 'خط الإنتاج الأول',
        batch_number: 'BATCH-001',
        production_date: '2024-09-24',
        status: Math.random() > 0.3 ? 'passed' : 'failed',
        quality_score: Math.random() * 20 + 80,
        el_scan_url: '/api/placeholder/el-scan.jpg',
        ir_scan_url: '/api/placeholder/ir-scan.jpg',
        visual_scan_url: '/api/placeholder/visual-scan.jpg',
      };
      
      const mockDefects = [
        {
          id: 1,
          defect_type: 'كسر في الخلايا',
          severity: 'high',
          confidence_score: 95.8,
          x_coordinate: 150,
          y_coordinate: 200,
          width: 50,
          height: 30,
          detection_method: 'EL'
        },
        {
          id: 2,
          defect_type: 'نقطة ساخنة',
          severity: 'medium',
          confidence_score: 87.2,
          x_coordinate: 300,
          y_coordinate: 100,
          width: 25,
          height: 25,
          detection_method: 'IR'
        }
      ];

      setPanel(mockPanel);
      setDefects(mockDefects);
    } catch (error) {
      console.error('Error fetching panel details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'failed':
        return <XCircle size={20} className="text-red-400" />;
      case 'under_review':
        return <Clock size={20} className="text-yellow-400" />;
      default:
        return <Activity size={20} className="text-blue-400" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getScanIcon = (type) => {
    switch (type) {
      case 'EL':
        return <Zap size={16} className="text-blue-400" />;
      case 'IR':
        return <Thermometer size={16} className="text-red-400" />;
      case 'Visual':
        return <Eye size={16} className="text-green-400" />;
      default:
        return <Camera size={16} className="text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F172A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white">جاري تحميل تفاصيل اللوح...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-gray-300 font-['Cairo']" dir="rtl">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
        
        .defect-highlight {
          position: absolute;
          border: 2px solid;
          border-radius: 4px;
          animation: pulse 2s infinite;
        }
        
        .defect-high {
          border-color: #F97316;
          background: rgba(249, 115, 22, 0.2);
        }
        
        .defect-medium {
          border-color: #EAB308;
          background: rgba(234, 179, 8, 0.2);
        }
        
        .defect-critical {
          border-color: #EF4444;
          background: rgba(239, 68, 68, 0.2);
        }
      `}</style>

      {/* Header */}
      <header className="bg-[#1E293B] border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowRight size={20} className="text-gray-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">تفاصيل اللوح الشمسي</h1>
                <p className="text-sm text-gray-400">فحص شامل ومتعدد الأطياف</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchPanelDetails}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              <RefreshCw size={16} />
              تحديث
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/30 transition-colors">
              <Download size={16} />
              تصدير التقرير
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Panel Info Cards */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-4 mb-6">
          {/* Serial Number */}
          <div className="bg-[#1E293B] rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Hash size={18} className="text-blue-400" />
              <span className="text-gray-400 text-sm">الرقم التسلسلي</span>
            </div>
            <p className="text-xl font-bold text-white">{panel?.serial_number}</p>
            <p className="text-xs text-gray-400 mt-1">{panel?.batch_number}</p>
          </div>

          {/* Status */}
          <div className="bg-[#1E293B] rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(panel?.status)}
              <span className="text-gray-400 text-sm">حالة الفحص</span>
            </div>
            <p className="text-xl font-bold text-white">
              {panel?.status === 'passed' ? 'مقبول' : panel?.status === 'failed' ? 'مرفوض' : 'تحت المراجعة'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              درجة الجودة: {panel?.quality_score?.toFixed(1)}%
            </p>
          </div>

          {/* Production Line */}
          <div className="bg-[#1E293B] rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <MapPin size={18} className="text-cyan-400" />
              <span className="text-gray-400 text-sm">خط الإنتاج</span>
            </div>
            <p className="text-xl font-bold text-white">{panel?.production_line_name}</p>
            <p className="text-xs text-gray-400 mt-1">المصنع الرئيسي - الرياض</p>
          </div>

          {/* Production Date */}
          <div className="bg-[#1E293B] rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Calendar size={18} className="text-green-400" />
              <span className="text-gray-400 text-sm">تاريخ الإنتاج</span>
            </div>
            <p className="text-xl font-bold text-white">
              {new Date(panel?.production_date).toLocaleDateString('ar-SA')}
            </p>
            <p className="text-xs text-gray-400 mt-1">منذ {Math.floor(Math.random() * 5) + 1} ساعات</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Scan Viewer */}
          <div className="lg:col-span-2 bg-[#1E293B] rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">صور الفحص المتعدد الأطياف</h3>
              <div className="flex gap-2">
                {['EL', 'IR', 'Visual'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedScanType(type)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                      selectedScanType === type
                        ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                        : 'bg-gray-700/20 border-gray-600 text-gray-400 hover:bg-gray-700/40'
                    }`}
                  >
                    {getScanIcon(type)}
                    <span className="text-sm font-medium">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scan Image with Defect Overlay */}
            <div className="relative bg-[#0F172A] rounded-xl border border-gray-600 overflow-hidden">
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                {/* Placeholder for actual scan image */}
                <div className="text-center">
                  <Camera size={48} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500">صورة الفحص {selectedScanType}</p>
                  <p className="text-xs text-gray-600 mt-1">دقة: 98.2% | وقت المعالجة: 1.2 ثانية</p>
                </div>

                {/* Defect Highlights */}
                {defects
                  .filter(defect => defect.detection_method === selectedScanType)
                  .map((defect) => (
                    <div
                      key={defect.id}
                      className={`defect-highlight defect-${defect.severity}`}
                      style={{
                        left: `${(defect.x_coordinate / 600) * 100}%`,
                        top: `${(defect.y_coordinate / 400) * 100}%`,
                        width: `${(defect.width / 600) * 100}%`,
                        height: `${(defect.height / 400) * 100}%`,
                      }}
                      title={`${defect.defect_type} - ${defect.confidence_score}%`}
                    />
                  ))}
              </div>

              {/* Scan Info Overlay */}
              <div className="absolute top-4 left-4 bg-black/70 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  {getScanIcon(selectedScanType)}
                  <span className="text-white text-sm font-medium">
                    فحص {selectedScanType === 'EL' ? 'التلألؤ الكهربائي' : 
                          selectedScanType === 'IR' ? 'الأشعة تحت الحمراء' : 'البصري'}
                  </span>
                </div>
              </div>
            </div>

            {/* Scan Statistics */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-[#0F172A] rounded-xl border border-gray-600">
                <p className="text-lg font-bold text-blue-400">98.2%</p>
                <p className="text-xs text-gray-400">دقة الفحص</p>
              </div>
              <div className="text-center p-3 bg-[#0F172A] rounded-xl border border-gray-600">
                <p className="text-lg font-bold text-green-400">1.2s</p>
                <p className="text-xs text-gray-400">وقت المعالجة</p>
              </div>
              <div className="text-center p-3 bg-[#0F172A] rounded-xl border border-gray-600">
                <p className="text-lg font-bold text-yellow-400">{defects.filter(d => d.detection_method === selectedScanType).length}</p>
                <p className="text-xs text-gray-400">عيوب مكتشفة</p>
              </div>
            </div>
          </div>

          {/* Defects List */}
          <div className="bg-[#1E293B] rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">العيوب المكتشفة</h3>
              <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                {defects.length} عيب
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {defects.map((defect) => (
                <div 
                  key={defect.id}
                  className={`p-4 rounded-xl border ${getSeverityColor(defect.severity)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getScanIcon(defect.detection_method)}
                      <span className="font-medium text-white">{defect.defect_type}</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-black/30 rounded">
                      {defect.detection_method}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">مستوى الثقة:</span>
                      <span className="text-white font-medium">{defect.confidence_score}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">الموقع:</span>
                      <span className="text-white">({defect.x_coordinate}, {defect.y_coordinate})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">الحجم:</span>
                      <span className="text-white">{defect.width}×{defect.height}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <button className="text-blue-400 hover:text-blue-300 text-sm">
                      عرض التفاصيل →
                    </button>
                  </div>
                </div>
              ))}

              {defects.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle size={48} className="text-green-400 mx-auto mb-2" />
                  <p className="text-gray-400">لم يتم اكتشاف أي عيوب</p>
                  <p className="text-xs text-gray-500 mt-1">اللوح يحقق معايير الجودة المطلوبة</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Analysis Summary */}
        <div className="mt-6 bg-[#1E293B] rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Target size={20} className="text-purple-400" />
            <h3 className="text-lg font-semibold text-white">تحليل الذكاء الاصطناعي</h3>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="p-4 bg-[#0F172A] rounded-xl border border-gray-600">
              <h4 className="font-medium text-white mb-2">التقييم العام</h4>
              <p className="text-sm text-gray-300 mb-3">
                {panel?.status === 'passed' 
                  ? 'اللوح يحقق معايير الجودة المطلوبة ومناسب للشحن'
                  : 'اللوح يحتوي على عيوب تتطلب مراجعة أو إعادة تصنيع'
                }
              </p>
              <div className="text-xs text-gray-400">
                درجة الثقة: 97.8%
              </div>
            </div>

            <div className="p-4 bg-[#0F172A] rounded-xl border border-gray-600">
              <h4 className="font-medium text-white mb-2">التوصيات</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• فحص إضافي للمنطقة العلوية</li>
                <li>• مراجعة عملية اللحام</li>
                <li>• تحسين التبريد في خط الإنتاج</li>
              </ul>
            </div>

            <div className="p-4 bg-[#0F172A] rounded-xl border border-gray-600">
              <h4 className="font-medium text-white mb-2">مؤشرات الأداء</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">الكفاءة المتوقعة:</span>
                  <span className="text-white">19.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">العمر المتوقع:</span>
                  <span className="text-white">25 سنة</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">معامل الحرارة:</span>
                  <span className="text-white">-0.38%/°C</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}