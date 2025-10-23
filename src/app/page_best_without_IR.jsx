"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Menu, X, Activity, AlertTriangle, CheckCircle, XCircle, Clock, Zap, Thermometer,
  Eye, Gauge, TrendingUp, Battery, Wifi, Search, Calendar, Plus, MoreHorizontal,
  RefreshCw, Settings, MapPin, Plane, Shield, Target, Users, Bell, ChevronDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Database, Image as ImageIcon, Cpu, UploadCloud, BarChart3, LineChart
} from "lucide-react";
import {
  AreaChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, ComposedChart, Line, BarChart
} from "recharts";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { arSA } from 'date-fns/locale';

// --- MOCK API & DATA (REBUILT FOR YEARLY DATA) ---

let DB_CACHE = {}; // Simple cache to avoid regenerating data

const ALL_DEFECT_TYPES = [
  { name: "short_circuit", label: "دائرة قصر", color: "#7f1d1d", severity: "critical" },
  { name: "crack", label: "شرخ", color: "#dc2626", severity: "critical" },
  { name: "star_crack", label: "شرخ نجمي", color: "#ef4444", severity: "high" },
  { name: "black_core", label: "قلب أسود", color: "#f97316", severity: "high" },
  { name: "fragment", label: "جزء مكسور", color: "#f59e0b", severity: "high" },
  { name: "corner", label: "زاوية مكسورة", color: "#eab308", severity: "medium" },
  { name: "vertical_dislocation", label: "انزياح عمودي", color: "#84cc16", severity: "medium" },
  { name: "horizontal_dislocation", label: "انزياح أفقي", color: "#22c55e", severity: "medium" },
  { name: "thick_line", label: "خط سميك", color: "#10b981", severity: "low" },
  { name: "printing_error", label: "خطأ طباعة", color: "#06b6d4", severity: "low" },
  { name: "scratch", label: "خدش", color: "#64748b", severity: "low" },
  { name: "finger", label: "خطوط توصيل", color: "#94a3b8", severity: "low" },
];

const generateYearlyData = (year) => {
    if (DB_CACHE[year]) return DB_CACHE[year];

    const panels = [];
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Simulate year-over-year improvements
    const baseProduction = year === 2023 ? 180 : 220;
    const defectRate = year === 2023 ? 0.3 : 0.22;

    for (let month = 0; month < 12; month++) {
        // Simulate monthly fluctuations
        const monthFactor = 1 + (Math.sin(month / 2) * 0.2); 
        const panelsThisMonth = Math.floor((baseProduction + Math.random() * 20) * monthFactor * daysInMonth[month]);

        for (let i = 0; i < panelsThisMonth; i++) {
            const day = Math.floor(Math.random() * daysInMonth[month]) + 1;
            const hour = Math.floor(Math.random() * 24);
            const minute = Math.floor(Math.random() * 60);
            const date = new Date(year, month, day, hour, minute);
            
            const hasDefects = Math.random() < defectRate;
            const defects = !hasDefects ? [] : Array.from({ length: Math.ceil(Math.random() * 3) }, () => {
                const type = ALL_DEFECT_TYPES[Math.floor(Math.random() * ALL_DEFECT_TYPES.length)];
                return {
                  type: type.label,
                  severity: type.severity,
                  location: { x: Math.random() * 90, y: Math.random() * 90, w: Math.random() * 10 + 5, h: Math.random() * 10 + 5 },
                  color: type.color
                };
            });

            panels.push({
              id: (year * 1000000) + (month * 10000) + i,
              serial_number: `SN-H7-${String(year * 100000 + i).padStart(8, '0')}`,
              timestamp: date.toISOString(),
              health_score: hasDefects ? (95 - Math.random() * 10) : (98 + Math.random() * 2),
              status: hasDefects ? 'failed' : 'passed',
              image_url: `https://placehold.co/600x400/0f172a/FFF?text=SN-${String(year * 100000 + i).padStart(8, '0')}`,
              defects,
              acknowledged: hasDefects ? Math.random() > 0.5 : true,
            });
        }
    }
    DB_CACHE[year] = panels;
    return panels;
};


const fetchDashboardData = async ({ dateRange, year }) => {
  await new Promise(res => setTimeout(res, 500));
  
  const ALL_PANELS_FOR_YEAR = generateYearlyData(year);

  const { start, end } = dateRange;
  const filteredPanels = ALL_PANELS_FOR_YEAR.filter(p => {
    const panelDate = new Date(p.timestamp);
    return panelDate >= start && panelDate <= end;
  });

  const total_panels = filteredPanels.length;
  const passed_panels = filteredPanels.filter(p => p.status === 'passed').length;
  const failed_panels = total_panels - passed_panels;
  
  const criticalAlerts = filteredPanels
    .filter(p => p.defects.some(d => d.severity === 'critical' || d.severity === 'high'))
    .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 4);

  // --- Advanced Defect Analysis ---
  const defectCounts = filteredPanels.reduce((acc, p) => {
    p.defects.forEach(d => { acc[d.type] = (acc[d.type] || 0) + 1; });
    return acc;
  }, {});

  const defectMap = Object.fromEntries(ALL_DEFECT_TYPES.map(d => [d.label, d]));

  const sortedDefects = Object.entries(defectCounts)
    .map(([name, count]) => ({ name, count, ...defectMap[name] }))
    .sort((a, b) => b.count - a.count);

  const totalDefects = sortedDefects.reduce((sum, d) => sum + d.count, 0);
  let cumulativeCount = 0;
  const paretoData = sortedDefects.map(d => {
    cumulativeCount += d.count;
    return {
      ...d,
      cumulativePercentage: totalDefects > 0 ? (cumulativeCount / totalDefects) * 100 : 0,
    };
  }).slice(0, 7); // Show top 7 for Pareto clarity

  // Dynamic data aggregation for the main chart
  const productionData = {};
  const durationInDays = (end - start) / (1000 * 60 * 60 * 24);

  if (durationInDays <= 1) { // Hourly data for 'Today'
      filteredPanels.forEach(p => {
        const hour = format(new Date(p.timestamp), 'yyyy-MM-dd-HH');
        if(!productionData[hour]) {
            productionData[hour] = { date: format(new Date(p.timestamp), 'ha', { locale: arSA }), inspected: 0, defects: 0 };
        }
        productionData[hour].inspected += 1;
        if (p.status === 'failed') {
            productionData[hour].defects += 1;
        }
      });
  } else if (durationInDays > 62) { // Monthly data for 'Year'
      filteredPanels.forEach(p => {
        const month = format(new Date(p.timestamp), 'yyyy-MM');
        if(!productionData[month]) {
            productionData[month] = { date: format(new Date(p.timestamp), 'MMM', { locale: arSA }), inspected: 0, defects: 0 };
        }
        productionData[month].inspected += 1;
        if (p.status === 'failed') {
            productionData[month].defects += 1;
        }
      });
  } else { // Daily data for 'Week' and 'Month'
      filteredPanels.forEach(p => {
        const day = format(new Date(p.timestamp), 'yyyy-MM-dd');
        if(!productionData[day]) {
            productionData[day] = { date: format(new Date(p.timestamp), 'MMM d', { locale: arSA }), inspected: 0, defects: 0 };
        }
        productionData[day].inspected += 1;
        if (p.status === 'failed') {
            productionData[day].defects += 1;
        }
      });
  }
  
  const sortedProductionData = Object.values(productionData).sort((a,b) => new Date(a.date) - new Date(b.date));

  const defect_rate = total_panels > 0 ? (failed_panels / total_panels) * 100 : 0;
  const hours = (end - start) / (1000 * 60 * 60);
  const throughput_per_hour = hours > 0 ? (total_panels / hours) : 0;

  return {
    stats: {
      total_panels,
      passed_panels,
      failed_panels,
      conformance_rate: total_panels > 0 ? (passed_panels / total_panels) * 100 : 100,
      defect_rate,
      throughput_per_hour,
    },
    criticalAlerts: criticalAlerts.map(p => ({
      id: p.id,
      serial_number: p.serial_number,
      defect_type: p.defects.find(d => d.severity === 'critical' || d.severity === 'high')?.type || 'عطل حرج',
      created_at: p.timestamp,
    })),
    fullDefectData: sortedDefects,
    paretoData,
    productionData: sortedProductionData,
  };
};

// --- CUSTOM COMPONENTS (within the same file) ---

const StatCard = ({ title, value, subtext, icon, color, subtextColor = "text-gray-400" }) => (
  <div className="bg-[#1E293B] rounded-2xl p-5 border border-gray-700 flex items-center justify-between">
    <div>
      <p className="text-gray-400 text-sm">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className={`text-xs ${subtextColor}`}>{subtext}</p>
    </div>
    <div className={`p-3 bg-gray-700/50 rounded-xl`}>{icon}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1F2937] text-white p-3 rounded-xl text-sm border border-gray-600">
        <p className="font-medium text-blue-300">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const REALISTIC_PANELS = [
    {
        "id": 2001,
        "serial_number": "SN-H7-20240118",
        "timestamp": "2024-05-21T14:22:15Z",
        "image_url": "https://github.com/hackingmaterials/pv-vision/blob/main/examples/object_detection/transformed_img/example_2.png?raw=true",
        "health_score": 97.4,
        "status": "failed",
        "defects": [
            { "type": "كسر خلايا", "color": "#EF4444", "severity": "critical", "location": { "x": 94, "y": 5, "w": 6, "h": 12 } },
            { "type": "كسر خلايا", "color": "#EF4444", "severity": "critical", "location": { "x": 94, "y": 72, "w": 6, "h": 12 } },
            { "type": "كسر خلايا", "color": "#EF4444", "severity": "critical", "location": { "x": 94, "y": 26, "w": 6, "h": 12 } },
            { "type": "تآكل موصلات", "color": "#EAB308", "severity": "medium", "location": { "x": 42, "y": 85, "w": 6, "h": 10 } },
            { "type": "تآكل موصلات", "color": "#EAB308", "severity": "medium", "location": { "x": 49, "y": 85, "w": 6, "h": 10 } }
        ]
    },
    {
        "id": 2002,
        "serial_number": "SN-H7-20240119",
        "timestamp": "2024-05-21T14:20:58Z",
        "image_url": "https://github.com/hackingmaterials/pv-vision/blob/main/examples/object_detection/transformed_img/example_14.png?raw=true",
        "health_score": 92.6,
        "status": "failed",
        "defects": [
            { "type": "كسر خلايا", "color": "#EF4444", "severity": "critical", "location": { "x": 68.6, "y": 5, "w": 6.5, "h": 10.5 } },
            { "type": "تآكل موصلات", "color": "#EAB308", "severity": "medium", "location": { "x": 94, "y": 37, "w": 6, "h": 12 } }
        ]
    },
    {
        "id": 2003,
        "serial_number": "SN-H7-20240120",
        "timestamp": new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(), // 3 days ago
        "image_url": "https://github.com/hackingmaterials/pv-vision/blob/main/examples/object_detection/transformed_img/example_6.png?raw=true",
        "health_score": 98.9,
        "status": "failed",
        "defects": [
            { "type": "كسر خلايا", "color": "#EF4444", "severity": "critical", "location": { "x": 69, "y": 0, "w": 7, "h": 11 } },
            { "type": "تآكل موصلات", "color": "#EAB308", "severity": "medium", "location": { "x": 88, "y": 62, "w": 7, "h": 13 } },
            { "type": "تآكل موصلات", "color": "#EAB308", "severity": "medium", "location": { "x": 37, "y": 88, "w": 7, "h": 11 } }
        ]
    },
    {
        "id": 2004,
        "serial_number": "SN-H7-20240121",
        "timestamp": new Date(new Date().setDate(new Date().getDate() - 8)).toISOString(), // 8 days ago
        "image_url": "https://github.com/hackingmaterials/pv-vision/blob/main/examples/object_detection/transformed_img/example_1.png?raw=true",
        "health_score": 99.8,
        "status": "passed",
        "defects": []
    },
    {
        "id": 2005,
        "serial_number": "SN-H7-20240122",
        "timestamp": new Date().toISOString(), // Today
        "image_url": "https://github.com/hackingmaterials/pv-vision/blob/main/examples/object_detection/transformed_img/example_8.png?raw=true",
        "health_score": 94.1,
        "status": "failed",
        "defects": [
            { "type": "كسر خلايا", "color": "#EF4444", "severity": "critical", "location": { "x": 0, "y": 50, "w": 6, "h": 11 } },
            { "type": "تآكل موصلات", "color": "#EAB308", "severity": "medium", "location": { "x": 37, "y": 88, "w": 6, "h": 12 } }
        ]
    },
    {
        "id": 2006,
        "serial_number": "SN-H7-20240123",
        "timestamp": new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), // Yesterday
        "image_url": "https://github.com/hackingmaterials/pv-vision/blob/main/examples/object_detection/transformed_img/example_3.png?raw=true",
        "health_score": 100.0,
        "status": "passed",
        "defects": []
    }
];


// --- MAIN APPLICATION ---
const PAGE_INFO = {
    dashboard: { main: 'لوحة التحكم', sub: 'نظرة عامة على أداء الإنتاج' },
    live: { main: 'خط الإنتاج المباشر', sub: 'نقطة الفحص المباشر - كاميرا A1' },
    gallery: { main: 'معرض الألواح', sub: 'سجل الألواح الشمسية المفحوصة' },
    ai_test: { main: 'اختبار نموذج الذكاء الاصطناعي', sub: 'تحقق من أداء النموذج على صور جديدة' }
};

export default function HaseenApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainSidebarCollapsed, setMainSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState("gallery");

  const navigateTo = (page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const NavLink = ({ page, text, icon, currentPage, navigateTo, collapsed }) => (
    <li>
      <button
        onClick={() => navigateTo(page)}
        className={`w-full flex items-center gap-4 py-3 px-4 rounded-xl transition-all duration-300 relative ${collapsed ? 'justify-center' : ''} ${
          currentPage === page
            ? "bg-sky-500/10 text-sky-400"
            : "hover:bg-gray-700/50 text-gray-400 hover:text-white"
        }`}
      >
        {currentPage === page && !collapsed && <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-400 rounded-l-md"></div>}
        {icon(currentPage === page ? "text-sky-400" : "text-gray-400")}
        <span className={`transition-opacity duration-200 whitespace-nowrap ${collapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100'}`}>
          {text}
        </span>
      </button>
    </li>
  );

  return (
    <div className="flex h-screen overflow-hidden text-sm text-gray-300 bg-[#0F172A] font-['Cairo']" dir="rtl">
       <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
        .status-indicator { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      {/* --- Sidebar (Right) - Collapsible & Resized --- */}
      <aside className={`bg-[#1E293B] border-l border-gray-700 z-50 flex flex-col transition-all duration-300 ${mainSidebarCollapsed ? "w-20" : "w-64"}`}>
         <div className="pt-6 pb-4 px-4 border-b border-gray-700 flex items-center justify-between">
            <div className={`flex items-center gap-3 transition-all duration-300 overflow-hidden ${mainSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white whitespace-nowrap">مِسبَــار</h2>
                <p className="text-xs text-gray-400 whitespace-nowrap">نظام الفحص الذكي</p>
              </div>
            </div>
            <button onClick={() => setMainSidebarCollapsed(!mainSidebarCollapsed)} className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0">
                {mainSidebarCollapsed ? <ChevronsLeft size={20} className="text-gray-400" /> : <Menu size={20} className="text-gray-400" />}
            </button>
          </div>
          <nav className="px-4 py-4 flex-1">
            <ul className="space-y-2">
                <NavLink page="dashboard" text="لوحة التحكم" icon={className => <Activity size={20} className={className}/>} currentPage={currentPage} navigateTo={navigateTo} collapsed={mainSidebarCollapsed} />
                <NavLink page="live" text="الخط المباشر" icon={className => <Target size={20} className={className}/>} currentPage={currentPage} navigateTo={navigateTo} collapsed={mainSidebarCollapsed} />
                <NavLink page="gallery" text="معرض الألواح" icon={className => <Database size={20} className={className}/>} currentPage={currentPage} navigateTo={navigateTo} collapsed={mainSidebarCollapsed} />
                <NavLink page="ai_test" text="اختبار النموذج" icon={className => <Cpu size={20} className={className}/>} currentPage={currentPage} navigateTo={navigateTo} collapsed={mainSidebarCollapsed} />
                <NavLink page="settings" text="الإعدادات" icon={className => <Settings size={20} className={className}/>} currentPage={currentPage} navigateTo={() => alert("Settings page not implemented yet.")} collapsed={mainSidebarCollapsed} />
            </ul>
          </nav>
          <div className={`p-4 border-t border-gray-700 transition-opacity ${mainSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            <div className="bg-gray-700/50 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-400">إصدار النظام</p>
              <p className="text-sm font-semibold text-white">v1.0.0 - تجريبي</p>
            </div>
          </div>
      </aside>
      
      <section className="flex-1 flex flex-col min-w-0">
        <header className="h-20 px-6 flex items-center justify-between border-b border-gray-700 bg-[#1E293B] flex-shrink-0">
           <div>
              <h1 className="text-xl font-bold text-white">
                {PAGE_INFO[currentPage]?.main || 'مِسبَــار'}
              </h1>
              {PAGE_INFO[currentPage]?.sub && (
                  <p className="text-sm font-normal text-gray-400">
                      {PAGE_INFO[currentPage].sub}
                  </p>
              )}
           </div>
           <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors relative">
                <Bell size={18} className="text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1E293B]"></span>
              </button>
              <div className="w-px h-8 bg-gray-700"></div>
              <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/50 rounded-lg p-2 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">م</span>
                </div>
                <div className="hidden sm:block">
                  <p className="font-semibold text-white">مشغل النظام</p>
                  <p className="text-xs text-gray-400">مهندس جودة</p>
                </div>
                <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
              </div>
            </div>
        </header>

        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'live' && <ProductionLinePage />}
        {currentPage === 'gallery' && <GalleryPage />}
        {currentPage === 'ai_test' && <AIModelTestPage />}
      </section>
    </div>
  );
}


// --- DASHBOARD PAGE COMPONENT (COMPLETELY REBUILT) ---
function DashboardPage() {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [activePreset, setActivePreset] = useState('month');
    const [defectView, setDefectView] = useState('pareto'); 
    
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['dashboardData', dateRange, selectedYear],
        queryFn: () => fetchDashboardData({ dateRange, year: selectedYear }),
        keepPreviousData: true,
    });
    
    useEffect(() => {
        setDatePreset('month'); 
    }, [selectedYear]);

    const setDatePreset = (preset) => {
        setActivePreset(preset);
        const today = new Date();
        const referenceDate = today.getFullYear() === selectedYear ? today : new Date(selectedYear, 0, 1);
        let start, end;
        if (preset === 'today') { start = startOfDay(referenceDate); end = endOfDay(referenceDate); } 
        else if (preset === 'week') { start = startOfWeek(referenceDate, { locale: arSA }); end = endOfWeek(referenceDate, { locale: arSA }); } 
        else if (preset === 'month') { start = startOfMonth(referenceDate); end = endOfMonth(referenceDate); }
        setDateRange({ start, end });
    };

    const handleYearChange = (year) => {
        setSelectedYear(year);
        setActivePreset(null); 
        setDateRange({ 
            start: startOfYear(new Date(year, 0, 1)),
            end: endOfYear(new Date(year, 0, 1))
        });
    }

    const dateDisplay = useMemo(() => {
        if (!dateRange.start || !dateRange.end) return "اختر تاريخ";
        if (activePreset === null) {
            return `عام ${selectedYear}`;
        }
        const formatString = "d MMMM yyyy";
        const startStr = format(dateRange.start, formatString, { locale: arSA });
        const endStr = format(dateRange.end, formatString, { locale: arSA });
        
        if(startStr === endStr) return startStr;
        return `${format(dateRange.start, 'd MMMM', { locale: arSA })} - ${endStr}`;
    }, [dateRange, activePreset, selectedYear]);

    if (isLoading) return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>
    if (isError) return <div className="flex h-full items-center justify-center text-red-400">حدث خطأ أثناء تحميل البيانات.</div>

    return (
        <main className="flex-1 overflow-y-auto p-6 bg-[#0F172A]">
            {/* --- Filters Header --- */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] rounded-xl border border-gray-600 min-w-[280px]">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="font-medium text-white">{dateDisplay}</span>
                    </div>
                    <div className="flex items-center bg-[#1E293B] rounded-xl border border-gray-600 p-1">
                        <button onClick={() => setDatePreset('today')} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === 'today' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>اليوم</button>
                        <button onClick={() => setDatePreset('week')} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === 'week' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>الأسبوع</button>
                        <button onClick={() => setDatePreset('month')} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === 'month' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>الشهر</button>
                    </div>
                     <div className="flex items-center bg-[#1E293B] rounded-xl border border-gray-600 p-1">
                        <button onClick={() => handleYearChange(currentYear)} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === null && selectedYear === currentYear ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>{currentYear}</button>
                        <button onClick={() => handleYearChange(currentYear - 1)} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === null && selectedYear === (currentYear - 1) ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>{currentYear - 1}</button>
                    </div>
                </div>
                <button onClick={() => refetch()} className="p-2 bg-[#1E293B] rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"><RefreshCw size={18} className="text-gray-400" /></button>
            </div>
            
            {/* --- Top Row: Stats Cards --- */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-5 mb-6">
                <StatCard title="إجمالي الفحص" value={data?.stats?.total_panels.toLocaleString() || 0} subtext="لوح شمسي" icon={<Activity size={24} className="text-blue-400" />} color="text-white"/>
                <StatCard title="الألواح السليمة" value={data?.stats?.passed_panels.toLocaleString() || 0} subtext="لوح" icon={<CheckCircle size={24} className="text-green-400" />} color="text-green-400"/>
                <StatCard title="الألواح المعيبة" value={data?.stats?.failed_panels.toLocaleString() || 0} subtext="لوح" icon={<XCircle size={24} className="text-red-400" />} color="text-red-400"/>
                <StatCard title="معدل المطابقة" value={`${Number(data?.stats?.conformance_rate || 0).toFixed(1)}%`} subtext="نسبة الإنتاج السليم" icon={<TrendingUp size={24} className="text-cyan-400" />} color="text-cyan-400"/>
                <StatCard title="معدل العيوب" value={`${Number(data?.stats?.defect_rate || 0).toFixed(1)}%`} subtext="نسبة الإنتاج المعيب" icon={<AlertTriangle size={24} className="text-orange-400" />} color="text-orange-400"/>
            </div>

<div className="flex justify-center mb-6">
    <div className="w-full max-w-2xl bg-[#1E293B] rounded-2xl border border-gray-700 p-2 flex flex-row items-stretch">
        
        {/* Metric 1: Productivity Pod (Visually on the Right) */}
        <div className="flex-1 flex items-center justify-between bg-slate-900/50 rounded-r-lg px-6 py-4">
            {/* VALUE COMES FIRST IN CODE FOR RTL */}
            <span className="text-2xl font-bold text-white">{Number(data?.stats?.throughput_per_hour || 0).toFixed(1)}</span>

            {/* LABEL COMES SECOND IN CODE FOR RTL */}
            <div className="flex items-center gap-3 text-gray-300">
               <Gauge size={20} />
               <span className="text-base">إنتاجية/ساعة</span>
            </div>
        </div>

        {/* Metric 2: Model Accuracy Pod (Visually on the Left) */}
        <div className="flex-1 flex items-center justify-between bg-slate-900/50 rounded-l-lg px-6 py-4 border-r border-slate-700">
            {/* VALUE COMES FIRST IN CODE FOR RTL */}
            <span className="text-2xl font-bold text-purple-400">97.4%</span>
            
            {/* LABEL COMES SECOND IN CODE FOR RTL */}
             <div className="flex items-center gap-3 text-gray-300">
               <Cpu size={20} className="text-purple-400"/>
               <span className="text-base">دقة النموذج</span>
            </div>
        </div>

    </div>
</div>

            {/* --- Bottom Row: Main Charts --- */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Left Column: Production Overview */}
                <div className="bg-[#1E293B] rounded-2xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">نظرة عامة على الإنتاج</h3>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.productionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                               <defs>
                                  <linearGradient id="colorInspected" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                                <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                                <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }} />
                                <Area type="monotone" dataKey="inspected" name="تم فحصها" stroke="#38BDF8" fillOpacity={1} fill="url(#colorInspected)" />
                                <Area type="monotone" dataKey="defects" name="معيبة" stroke="#EF4444" fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Column: Defect Analysis Center */}
                <div className="bg-[#1E293B] rounded-2xl p-6 border border-gray-700 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">مركز تحليل العيوب</h3>
                        <div className="flex items-center bg-[#0F172A] rounded-lg border border-gray-600 p-1">
                            <button onClick={() => setDefectView('pareto')} className={`px-2 py-1 rounded-md text-xs transition-colors flex items-center gap-1 ${defectView === 'pareto' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}><LineChart size={14}/> <span>التأثير</span></button>
                            <button onClick={() => setDefectView('full')} className={`px-2 py-1 rounded-md text-xs transition-colors flex items-center gap-1 ${defectView === 'full' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}><BarChart3 size={14}/> <span>الكل</span></button>
                        </div>
                    </div>
                     <div className="flex-1 h-96">
                        {data?.fullDefectData && data.fullDefectData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                {defectView === 'pareto' ? (
                                    <ComposedChart data={data.paretoData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9CA3AF" }} angle={-25} textAnchor="end" height={40} />
                                        <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                                        <YAxis yAxisId="right" orientation="right" tickFormatter={(tick) => `${tick}%`} tick={{ fontSize: 10, fill: "#f97316" }} />
                                        <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }} />
                                        <Bar yAxisId="left" dataKey="count" name="العدد" fill="#38BDF8" />
                                        <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" name="النسبة التراكمية" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                                    </ComposedChart>
                                ) : (
                                    <BarChart layout="vertical" data={data.fullDefectData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                                        <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }} cursor={{ fill: '#374151' }}/>
                                        <Bar dataKey="count" name="العدد">
                                            {data.fullDefectData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        ) : <p className="text-sm text-gray-500 text-center py-4">لا توجد بيانات عيوب لعرضها.</p>}
                    </div>
                </div>
            </div>
        </main>
    );
}

// --- PRODUCTION LINE PAGE - REBUILT LAYOUT ---
function ProductionLinePage() {
    const [panelIndex, setPanelIndex] = useState(0);
    
    const [alerts, setAlerts] = useState(() => {
        const firstPanel = REALISTIC_PANELS[0];
        if (firstPanel && firstPanel.status === 'failed') {
            return [{ 
                id: firstPanel.id + Math.random(), 
                serial_number: firstPanel.serial_number, 
                message: `تم اكتشاف ${firstPanel.defects.length} عيوب.`, 
                timestamp: new Date().toISOString(), 
                acknowledged: false 
            }];
        }
        return [];
    });

    const [isFading, setIsFading] = useState(false);
    
    const currentPanel = REALISTIC_PANELS[panelIndex];

    useEffect(() => {
        const interval = setInterval(() => {
            setIsFading(true);
            setTimeout(() => {
                setPanelIndex(prevIndex => {
                    const nextIndex = (prevIndex + 1) % REALISTIC_PANELS.length;
                    const nextPanel = REALISTIC_PANELS[nextIndex];
                    
                    if (nextPanel.status === 'failed') {
                        setAlerts(prevAlerts => {
                            const alertExists = prevAlerts.some(alert => alert.serial_number === nextPanel.serial_number);

                            if (!alertExists) {
                                const newAlert = { 
                                    id: nextPanel.id + Math.random(), 
                                    serial_number: nextPanel.serial_number, 
                                    message: `تم اكتشاف ${nextPanel.defects.length} عيوب.`, 
                                    timestamp: new Date().toISOString(), 
                                    acknowledged: false 
                                };
                                return [newAlert, ...prevAlerts].slice(0, 50);
                            }
                            
                            return prevAlerts;
                        });
                    }
                    return nextIndex;
                });
                setIsFading(false);
            }, 500); 
        }, 3000); 
        
        return () => clearInterval(interval);
    }, []);
    
    const acknowledgeAlert = (id) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    };

    return (
        <div className="flex-1 flex overflow-hidden">
            <aside className="w-80 bg-[#1E293B] border-r border-gray-700 flex flex-col flex-shrink-0">
                <h3 className="text-lg font-semibold text-white p-6 border-b border-gray-700 flex-shrink-0">سجل التنبيهات الفوري</h3>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-col gap-4">
                        {alerts.map(alert => (
                            <div key={alert.id} className={`w-full p-4 rounded-xl border transition-all duration-300 ${alert.acknowledged ? 'bg-gray-700/30 border-gray-600' : 'bg-orange-500/10 border-orange-500/30'}`}>
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-2">
                                        <AlertTriangle size={18} className={`${alert.acknowledged ? 'text-gray-500' : 'text-orange-400'}`}/>
                                        <p className="font-mono text-sm text-white flex-1">{alert.serial_number}</p>
                                        {!alert.acknowledged && <div className={`w-2.5 h-2.5 rounded-full bg-orange-400 status-indicator`}></div>}
                                    </div>
                                    <p className="text-xs text-gray-300 flex-1">{alert.message}</p>
                                    <div className="flex items-end justify-between mt-3">
                                        <p className="text-xs text-gray-400">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                                        {alert.acknowledged ? (
                                            <div className="flex items-center gap-1 text-xs text-green-400">
                                                <CheckCircle size={14}/>
                                                <span>تم التأكيد</span>
                                            </div>
                                        ) : (
                                            <button onClick={() => acknowledgeAlert(alert.id)} className="text-xs text-blue-300 hover:text-white whitespace-nowrap bg-blue-600/50 hover:bg-blue-600 px-3 py-1 rounded-md transition-colors">تأكيد</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {alerts.length === 0 && (
                            <div className="text-center py-8 h-full flex flex-col justify-center w-full">
                                <CheckCircle size={48} className="text-green-400 mx-auto mb-2"/>
                                <p className="text-gray-400">لا توجد تنبيهات جديدة.</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
            <main className="flex-1 flex flex-col p-6 bg-[#0F172A] gap-6 overflow-hidden">
                <div className="flex-1 bg-[#1E293B] rounded-2xl p-6 border border-gray-700 flex flex-col min-h-0">
                    <div className="flex-1 w-full flex items-center justify-center min-h-0 py-2">
                        <div className="h-full max-w-full aspect-video mx-auto bg-black rounded-lg relative overflow-hidden shadow-2xl shadow-black/50">
                            {currentPanel ? (
                                <>
                                   <img 
                                     key={currentPanel.id}
                                     src={currentPanel.image_url} 
                                     alt={`Solar Panel ${currentPanel.serial_number}`} 
                                     className={`h-full w-full object-contain transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`} 
                                    />
                                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                                    {currentPanel.defects.map((defect, i) => (
                                        <div key={i} className="absolute border-2 rounded-sm" style={{
                                            borderColor: defect.color, 
                                            boxShadow: `0 0 15px ${defect.color}`,
                                            left: `${defect.location.x}%`, top: `${defect.location.y}%`,
                                            width: `${defect.location.w}%`, height: `${defect.location.h}%`,
                                            opacity: isFading ? 0 : 1,
                                            transition: 'opacity 0.5s'
                                        }}>
                                            <span className="absolute -top-6 -right-1 text-xs px-2 py-0.5 rounded-md font-semibold text-white whitespace-nowrap" style={{ backgroundColor: defect.color }}>{defect.type}</span>
                                        </div>
                                    ))}
                                </>
                            ) : ( <div className="text-center text-gray-400 p-8"><ImageIcon size={48} className="mx-auto mb-2"/><p>جاري تهيئة نظام الفحص...</p></div> )}
                        </div>
                    </div>
                    {currentPanel && (
                        <div className={`mt-4 bg-[#0F172A] border border-gray-700 rounded-xl p-3 grid grid-cols-4 gap-4 text-center w-full max-w-4xl mx-auto transition-opacity duration-500 flex-shrink-0 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                            <div><p className="text-xs text-gray-400">الرقم التسلسلي</p><p className="font-mono text-white text-base">{currentPanel.serial_number}</p></div>
                            <div><p className="text-xs text-gray-400">وقت الفحص</p><p className="font-mono text-white text-base">{new Date().toLocaleTimeString()}</p></div>
                            <div><p className="text-xs text-gray-400">دقة التوقع</p><p className={`font-bold text-xl ${currentPanel.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>{currentPanel.health_score.toFixed(1)}%</p></div>
                            <div><p className="text-xs text-gray-400">النتيجة</p><p className={`font-bold text-xl ${currentPanel.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>{currentPanel.status === 'passed' ? 'سليم' : 'معيب'}</p></div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// --- GALLERY PAGE COMPONENT ---
const GalleryCard = ({ panel }) => {
  return (
    <div className="bg-[#1E293B] rounded-2xl p-4 border border-gray-700 flex flex-col gap-4">
      {/* Image viewer */}
      <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
        <img src={panel.image_url} alt={`Panel ${panel.serial_number}`} className="h-full w-full object-contain" />
        {panel.defects.map((defect, i) => (
          <div key={i} className="absolute border-2 rounded-sm opacity-90" style={{
              borderColor: defect.color,
              boxShadow: `0 0 8px ${defect.color}`,
              left: `${defect.location.x}%`,
              top: `${defect.location.y}%`,
              width: `${defect.location.w}%`,
              height: `${defect.location.h}%`
          }}>
          </div>
        ))}
      </div>
      {/* Info section */}
      <div>
        <div className="flex justify-between items-center mb-2">
            <p className="font-mono text-base text-blue-400">{panel.serial_number}</p>
            <div className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar size={14} />
                <span>{new Date(panel.timestamp).toLocaleString('ar-SA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
        <div className="flex justify-between items-center gap-4 pt-3 border-t border-gray-700/50">
          <div className="text-center">
            <p className="text-xs text-gray-400">النتيجة</p>
            <p className={`font-bold text-lg ${panel.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>
              {panel.status === 'passed' ? 'سليم' : 'معيب'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">دقة التوقع</p>
            <p className={`font-bold text-lg ${panel.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>
              {panel.health_score.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">العيوب</p>
            <p className="font-bold text-lg text-white">{panel.defects.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};


// ▼▼▼ START: UPDATED GalleryPage COMPONENT ▼▼▼
function GalleryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activePreset, setActivePreset] = useState('all');

    const filteredPanels = useMemo(() => {
        const now = new Date();
        let start, end;

        switch (activePreset) {
            case 'today':
                start = startOfDay(now);
                end = endOfDay(now);
                break;
            case 'week':
                start = startOfWeek(now, { locale: arSA });
                end = endOfWeek(now, { locale: arSA });
                break;
            case 'month':
                start = startOfMonth(now);
                end = endOfMonth(now);
                break;
            case 'all':
            default:
                start = null;
                end = null;
                break;
        }
        
        return REALISTIC_PANELS
            .filter(panel => {
                const matchesSearch = panel.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
                if (!matchesSearch) return false;

                if (!start || !end) return true; // 'all' case returns true
                
                const panelDate = new Date(panel.timestamp);
                return panelDate >= start && panelDate <= end;
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [searchTerm, activePreset]);

    return (
        <main className="flex-1 overflow-y-auto p-6 bg-[#0F172A]">
             {/* Controls Header: Search and Filters */}
             <div className="flex justify-start items-center gap-4 mb-6">
                {/* Search Bar */}
                <div className="relative max-w-sm">
                    <input 
                        type="text"
                        placeholder="ابحث بالرقم التسلسلي..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#1E293B] border border-gray-600 rounded-lg py-2 pr-10 pl-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                </div>

                {/* Date Filters */}
                <div className="flex items-center bg-[#1E293B] rounded-xl border border-gray-600 p-1">
                    <button onClick={() => setActivePreset('today')} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === 'today' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>اليوم</button>
                    <button onClick={() => setActivePreset('week')} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === 'week' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>الأسبوع</button>
                    <button onClick={() => setActivePreset('month')} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === 'month' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>الشهر</button>
                    <button onClick={() => setActivePreset('all')} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>الكل</button>
                </div>
             </div>

             {/* Grid of panels */}
             {filteredPanels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPanels.map(panel => (
                        <GalleryCard key={panel.id} panel={panel} />
                    ))}
                </div>
             ) : (
                <div className="text-center py-20">
                    <Search size={48} className="text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white">لم يتم العثور على نتائج</h3>
                    <p className="text-gray-400 mt-2">حاول تعديل مصطلح البحث أو تغيير فلتر التاريخ.</p>
                </div>
             )}
        </main>
    );
}
// ▲▲▲ END: UPDATED GalleryPage COMPONENT ▲▲▲


// --- PREDEFINED DEFECTS FOR AI TEST PAGE (BASED ON YOUR JSON) ---
const PREDEFINED_DEFECTS_SET_1 = [
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 68.33, y: 39.5, w: 7, h: 10.5 } },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 94, y: 30, w: 6, h: 10.5 } },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 87.8, y: 58.5, w: 6, h: 10.5 } },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 12, y: 12.33, w: 6, h: 10 } },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 0.2, y: 60, w: 6, h: 8.5 } },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 0.17, y: 22.5, w: 6, h: 10.2} },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 94.3, y: 68, w: 6, h: 10.2 } },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 55.6, y: 58.5, w: 6, h: 10.2 } },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 5.83, y: 22.6, w: 6, h: 10.1 } },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 30, y: 40, w: 6, h: 10.2 } },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 81.4, y: 49, w: 6.4, h: 10.5 } },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 94.3, y: 49, w: 6, h: 10.5 } },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 12, y: 13, w: 6, h: 10.2 } },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 55.8, y: 30, w: 6.3, h: 10.5 } },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 11.75, y: 22.2, w: 6.2, h: 10.1 } },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 11.5, y: 50, w: 6, h: 10.2 } },
    { type: 'كسر خلايا', color: '#EF4444', location: { x: 55.5, y: 69, w: 6.2, h: 10 } },
    { type: 'تآكل موصلات', color: '#EAB308', location: { x: 81.4, y: 49, w: 6.5, h: 10.5 } },
    { type: 'تآكل موصلات', color: '#EAB308', location: { x: 36.17, y: 68.3, w: 6.5, h: 10 } },
    { type: 'تآكل موصلات', color: '#EAB308', location: { x: 37, y: 20.7, w: 6, h: 10 } },
    { type: 'تآكل موصلات', color: '#EAB308', location: { x: 55.83, y: 13, w: 6.7, h: 8.5 } }
];

// --- AI MODEL TEST PAGE (WITH IMPROVED UI) ---
function AIModelTestPage() {
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [uploadSequence, setUploadSequence] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileChange = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('الرجاء اختيار ملف صورة صالح.');
            return;
        }
        setError(null);
        setResults(null);
        setImageFile(file);
        setImageUrl(URL.createObjectURL(file));
        setUploadSequence(prev => prev + 1);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const runAIAnalysis = async () => {
        if (!imageFile) return;
        setIsProcessing(true);
        await new Promise(res => setTimeout(res, 2500));
        
        const isDefectiveCase = uploadSequence % 2 !== 0; 
        let newResults;
        if (isDefectiveCase) {
            newResults = {
                defects: PREDEFINED_DEFECTS_SET_1,
                status: 'failed',
                health_score: 91.5,
            };
        } else {
            newResults = {
                defects: [],
                status: 'passed',
                health_score: 98.6,
            };
        }
        setResults(newResults);
        setIsProcessing(false);
    };

    const resetState = () => {
        setImageFile(null);
        setImageUrl(null);
        setResults(null);
        setError(null);
        setIsProcessing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <main className="flex-1 overflow-y-auto p-6 bg-[#0F172A]">
            {!imageUrl ? (
                 <div 
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-2xl text-center p-8"
                >
                    <UploadCloud size={64} className="text-gray-500 mb-4"/>
                    <h2 className="text-xl font-semibold text-white mb-2">اسحب وأفلت صورة اللوح الشمسي هنا</h2>
                    <p className="text-gray-400 mb-6">أو يمكنك اختيار ملف من جهازك</p>
                    <input 
                        type="file" 
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => handleFileChange(e.target.files[0])} 
                        className="hidden"
                    />
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                        اختر ملف
                    </button>
                    {error && <p className="text-red-400 mt-4">{error}</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    <div className="lg:col-span-2 bg-[#1E293B] rounded-2xl p-6 border border-gray-700 flex items-center justify-center">
                        <div className="w-full h-full relative">
                           <img src={imageUrl} alt="Uploaded Panel" className="w-full h-full object-contain" />
                           {results && results.defects.map((defect, i) => (
                                <div key={i} className="absolute border-2 rounded-sm" style={{
                                    borderColor: defect.color, 
                                    boxShadow: `0 0 15px ${defect.color}`,
                                    left: `${defect.location.x}%`, top: `${defect.location.y}%`,
                                    width: `${defect.location.w}%`, height: `${defect.location.h}%`,
                                }}>
                                    <span className="absolute -top-6 -right-1 text-xs px-2 py-0.5 rounded-md font-semibold text-white whitespace-nowrap" style={{ backgroundColor: defect.color }}>{defect.type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-[#1E293B] rounded-2xl p-6 border border-gray-700 flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-4">نتائج التحليل</h3>
                        
                        {isProcessing ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4"></div>
                                <p className="text-gray-300">جاري تحليل الصورة...</p>
                                <p className="text-xs text-gray-500">قد يستغرق هذا بضع ثوانٍ.</p>
                            </div>
                        ) : results ? (
                            <div className="flex-1 flex flex-col">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-[#0F172A] p-4 rounded-lg text-center">
                                        <p className="text-sm text-gray-400">النتيجة</p>
                                        <p className={`text-2xl font-bold ${results.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>
                                            {results.status === 'passed' ? 'سليم' : 'معيب'}
                                        </p>
                                    </div>
                                    <div className="bg-[#0F172A] p-4 rounded-lg text-center">
                                        <p className="text-sm text-gray-400">معدل الصحة</p>
                                        <p className={`text-2xl font-bold ${results.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>
                                            {results.health_score.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                                <h4 className="font-semibold text-white mb-2">العيوب المكتشفة:</h4>
                                <div className="flex-1 overflow-y-auto pr-2">
                                    {results.defects.length > 0 ? (
                                        (() => {
                                            const defectSummary = Object.values(results.defects.reduce((acc, defect) => {
                                                if (!acc[defect.type]) {
                                                    acc[defect.type] = { type: defect.type, color: defect.color, count: 0 };
                                                }
                                                acc[defect.type].count++;
                                                return acc;
                                            }, {}));

                                            return (
                                                <ul className="space-y-3 mt-2">
                                                    {defectSummary.map((d, i) => (
                                                        <li key={i} className="flex justify-between items-center text-base p-2 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-medium text-gray-200">{d.type}</span>
                                                                <span className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></span>
                                                            </div>
                                                            {d.count > 1 && (
                                                                <span className="font-mono text-sm bg-slate-700 text-slate-300 px-2 py-1 rounded-lg">
                                                                    x{d.count}
                                                                </span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            );
                                        })()
                                    ) : <p className="text-sm text-gray-500 mt-4">لم يتم العثور على أي عيوب.</p>}
                                </div>
                            </div>
                        ) : (
                             <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <CheckCircle size={48} className="text-gray-500 mb-4"/>
                                <p className="text-gray-300">الصورة جاهزة للاختبار.</p>
                                <p className="text-xs text-gray-500">اضغط على زر "بدء التحليل" لتشغيل النموذج.</p>
                            </div>
                        )}

                        <div className="mt-auto pt-4 flex gap-4">
                            <button onClick={resetState} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">اختبار صورة أخرى</button>
                            <button onClick={runAIAnalysis} disabled={isProcessing || !imageFile} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                               {isProcessing ? 'جاري التحليل...' : 'بدء التحليل'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}