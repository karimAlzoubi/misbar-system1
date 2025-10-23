"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Menu, X, Activity, AlertTriangle, CheckCircle, XCircle, Clock, Zap, Thermometer,
  Eye, Gauge, TrendingUp, Battery, Wifi, Search, Calendar, Plus, MoreHorizontal,
  RefreshCw, Settings, MapPin, Plane, Shield, Target, Users, Bell, ChevronDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Database, Image as ImageIcon, Cpu, UploadCloud, BarChart3, LineChart, Globe
} from "lucide-react";
import {
  AreaChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, ComposedChart, Line, BarChart
} from "recharts";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';

// --- I18N (TRANSLATION) SETUP ---

const translations = {
  // General
  system_name: { en: "Misbar", ar: "مِسبَــار" },
  system_subtitle: { en: "Smart Inspection System", ar: "نظام الفحص الذكي" },
  system_version: { en: "System Version", ar: "إصدار النظام" },
  version_number: { en: "v1.0.0 - Beta", ar: "v1.0.0 - تجريبي" },
  operator_name: { en: "System Operator", ar: "مشغل النظام" },
  operator_role: { en: "Quality Engineer", ar: "مهندس جودة" },
  all: { en: "All", ar: "الكل" },
  
  // Navigation
  nav_dashboard: { en: "Dashboard", ar: "لوحة التحكم" },
  nav_live_el: { en: "Live Feed (EL)", ar: "خط مباشر (EL)" },
  nav_live_ir: { en: "Live Feed (IR)", ar: "خط مباشر (IR)" },
  nav_gallery: { en: "Panels Gallery", ar: "معرض الألواح" },
  nav_ai_test: { en: "AI Model Test", ar: "اختبار النموذج" },
  nav_settings: { en: "Settings", ar: "الإعدادات" },

  // Page Info
  dashboard_main: { en: "Dashboard", ar: "لوحة التحكم" },
  dashboard_sub: { en: "Overview of production performance", ar: "نظرة عامة على أداء الإنتاج" },
  live_el_main: { en: "Live Feed (EL)", ar: "الخط المباشر (EL)" },
  live_el_sub: { en: "Live Inspection Point - Electroluminescence", ar: "نقطة الفحص المباشر - Electroluminescence" },
  live_ir_main: { en: "Live Feed (IR)", ar: "الخط المباشر (IR)" },
  live_ir_sub: { en: "Live Inspection Point - Infrared", ar: "نقطة الفحص المباشر - Infrared" },
  gallery_main: { en: "Panels Gallery", ar: "معرض الألواح" },
  gallery_sub: { en: "History of inspected solar panels", ar: "سجل الألواح الشمسية المفحوصة" },
  ai_test_main: { en: "AI Model Test", ar: "اختبار نموذج الذكاء الاصطناعي" },
  ai_test_sub: { en: "Check model performance on new images", ar: "تحقق من أداء النموذج على صور جديدة" },

  // Dashboard Page
  stat_total: { en: "Total Inspected", ar: "إجمالي الفحص" },
  stat_passed: { en: "Passed Panels", ar: "الألواح السليمة" },
  stat_failed: { en: "Defective Panels", ar: "الألواح المعيبة" },
  stat_conformance: { en: "Conformance Rate", ar: "معدل المطابقة" },
  stat_defect_rate: { en: "Defect Rate", ar: "معدل العيوب" },
  panel_unit: { en: "panel", ar: "لوح" },
  solar_panel_unit: { en: "solar panel", ar: "لوح شمسي" },
  passed_production_ratio: { en: "Ratio of passed production", ar: "نسبة الإنتاج السليم" },
  failed_production_ratio: { en: "Ratio of failed production", ar: "نسبة الإنتاج المعيب" },
  throughput_per_hour: { en: "Throughput/Hour", ar: "إنتاجية/ساعة" },
  model_accuracy: { en: "Model Accuracy", ar: "دقة النموذج" },
  production_overview: { en: "Production Overview", ar: "نظرة عامة على الإنتاج" },
  defect_analysis_center: { en: "Defect Analysis Center", ar: "مركز تحليل العيوب" },
  impact: { en: "Impact", ar: "التأثير" },
  no_defect_data: { en: "No defect data to display.", ar: "لا توجد بيانات عيوب لعرضها." },
  inspected_chart: { en: "Inspected", ar: "تم فحصها" },
  defective_chart: { en: "Defective", ar: "معيبة" },
  count_chart: { en: "Count", ar: "العدد" },
  cumulative_perc_chart: { en: "Cumulative %", ar: "النسبة التراكمية" },
  today: { en: "Today", ar: "اليوم" },
  week: { en: "Week", ar: "الأسبوع" },
  month: { en: "Month", ar: "الشهر" },
  year_display: { en: "Year", ar: "عام" },
  choose_date: { en: "Select Date", ar: "اختر تاريخ" },
  
  // Live Feed Page
  realtime_alerts: { en: "Real-time Alerts", ar: "سجل التنبيهات الفوري" },
  defects_detected: { en: "defects detected.", ar: "عيوب." },
  num_defects_detected: { en: "Detected", ar: "تم اكتشاف" },
  no_new_alerts: { en: "No new alerts.", ar: "لا توجد تنبيهات جديدة." },
  acknowledge: { en: "Acknowledge", ar: "تأكيد" },
  acknowledged: { en: "Acknowledged", ar: "تم التأكيد" },
  serial_number: { en: "Serial Number", ar: "الرقم التسلسلي" },
  inspection_time: { en: "Inspection Time", ar: "وقت الفحص" },
  health_score: { en: "Health Score", ar: "دقة التوقع" },
  result: { en: "Result", ar: "النتيجة" },
  passed: { en: "Passed", ar: "سليم" },
  failed: { en: "Failed", ar: "معيب" },
  initializing_inspection: { en: "Initializing inspection system...", ar: "جاري تهيئة نظام الفحص..." },

  // Gallery Page
  search_placeholder: { en: "Search by serial number...", ar: "ابحث بالرقم التسلسلي..." },
  defects_count: { en: "Defects", ar: "العيوب" },
  no_results_found: { en: "No Results Found", ar: "لم يتم العثور على نتائج" },
  try_modifying_search: { en: "Try modifying your search term or changing the date filter.", ar: "حاول تعديل مصطلح البحث أو تغيير فلتر التاريخ." },

  // AI Test Page
  drop_image_title: { en: "Drag & drop a solar panel image here", ar: "اسحب وأفلت صورة اللوح الشمسي هنا" },
  drop_image_subtitle: { en: "Or you can select a file from your device", ar: "أو يمكنك اختيار ملف من جهازك" },
  select_file: { en: "Select File", ar: "اختر ملف" },
  invalid_file_error: { en: "Please select a valid image file.", ar: "الرجاء اختيار ملف صورة صالح." },
  analysis_results: { en: "Analysis Results", ar: "نتائج التحليل" },
  analyzing_image: { en: "Analyzing image...", ar: "جاري تحليل الصورة..." },
  analysis_time_notice: { en: "This may take a few seconds.", ar: "قد يستغرق هذا بضع ثوانٍ." },
  image_ready: { en: "Image is ready for testing.", ar: "الصورة جاهزة للاختبار." },
  click_start_analysis: { en: "Click the 'Start Analysis' button to run the model.", ar: "اضغط على زر \"بدء التحليل\" لتشغيل النموذج." },
  detected_defects: { en: "Detected Defects:", ar: "العيوب المكتشفة:" },
  no_defects_found: { en: "No defects were found.", ar: "لم يتم العثور على أي عيوب." },
  test_another_image: { en: "Test Another Image", ar: "اختبار صورة أخرى" },
  start_analysis: { en: "Start Analysis", ar: "بدء التحليل" },
  analyzing: { en: "Analyzing...", ar: "جاري التحليل..." },
  critical_defect: { en: "Critical Defect", ar: "عطل حرج" },
};

const LanguageContext = createContext();
const useLang = () => useContext(LanguageContext);

// --- MOCK API & DATA (REBUILT FOR YEARLY DATA & I18N) ---

let DB_CACHE = {};

const EL_DEFECT_TYPES = [ { name: "finger", ar: "خطوط توصيل", en: "Finger Lines", color: "#94a3b8", severity: "low" }, { name: "crack", ar: "شرخ", en: "Crack", color: "#dc2626", severity: "critical" }, { name: "black_core", ar: "قلب أسود", en: "Black Core", color: "#f97316", severity: "high" }, { name: "thick_line", ar: "خط سميك", en: "Thick Line", color: "#10b981", severity: "low" }, { name: "horizontal_dislocation", ar: "انزياح أفقي", en: "Horizontal Dislocation", color: "#22c55e", severity: "medium" }, { name: "short_circuit", ar: "دائرة قصر", en: "Short Circuit", color: "#7f1d1d", severity: "critical" }, { name: "vertical_dislocation", ar: "انزياح عمودي", en: "Vertical Dislocation", color: "#84cc16", severity: "medium" }, { name: "star_crack", ar: "شرخ نجمي", en: "Star Crack", color: "#ef4444", severity: "high" }, { name: "printing_error", ar: "خطأ طباعة", en: "Printing Error", color: "#06b6d4", severity: "low" }, { name: "corner", ar: "زاوية مكسورة", en: "Broken Corner", color: "#eab308", severity: "medium" }, { name: "fragment", ar: "جزء مكسور", en: "Fragment", color: "#f59e0b", severity: "high" }, { name: "scratch", ar: "خدش", en: "Scratch", color: "#64748b", severity: "low" }, ];
const IR_DEFECT_TYPES = [ { name: "cell", ar: "خلية ساخنة", en: "Hot Cell", color: "#facc15", severity: "medium" }, { name: "cell_multi", ar: "خلايا متعددة ساخنة", en: "Multiple Hot Cells", color: "#f59e0b", severity: "high" }, { name: "cracking", ar: "تشقق", en: "Cracking", color: "#dc2626", severity: "critical" }, { name: "hot_spot", ar: "نقطة ساخنة", en: "Hot Spot", color: "#ef4444", severity: "high" }, { name: "hot_spot_multi", ar: "نقاط ساخنة متعددة", en: "Multiple Hot Spots", color: "#b91c1c", severity: "critical" }, { name: "shadowing", ar: "تظليل", en: "Shadowing", color: "#64748b", severity: "low" }, { name: "diode", ar: "دايود مُفعّل", en: "Active Diode", color: "#fb923c", severity: "medium" }, { name: "diode_multi", ar: "دايودات متعددة مُفعّلة", en: "Multiple Active Diodes", color: "#f97316", severity: "high" }, { name: "vegetation", ar: "نباتات", en: "Vegetation", color: "#22c55e", severity: "low" }, { name: "soiling", ar: "اتساخ", en: "Soiling", color: "#a16207", severity: "low" }, { name: "offline_module", ar: "لوح غير فعال", en: "Offline Module", color: "#7f1d1d", severity: "critical" }, ];
const USER_DEFECT_TYPES = [ { name: "cell_crack", ar: "كسر خلايا", en: "Cell Crack", color: "#EF4444", severity: "critical" }, { name: "connector_corrosion", ar: "تآكل موصلات", en: "Connector Corrosion", color: "#EAB308", severity: "medium" }, ];
const ALL_DEFECT_TYPES = [...EL_DEFECT_TYPES, ...IR_DEFECT_TYPES, ...USER_DEFECT_TYPES];
const ALL_DEFECT_MAP = Object.fromEntries(ALL_DEFECT_TYPES.map(d => [d.name, d]));
const USER_DEFECT_AR_TO_NAME_MAP = { "كسر خلايا": "cell_crack", "تآكل موصلات": "connector_corrosion" };

const generateYearlyData = (year) => {
    if (DB_CACHE[year]) return DB_CACHE[year];

    const panels = [];
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    const baseProduction = year === 2023 ? 180 : 220;
    const defectRate = year === 2023 ? 0.3 : 0.22;

    for (let month = 0; month < 12; month++) {
        const monthFactor = 1 + (Math.sin(month / 2) * 0.2); 
        const panelsThisMonth = Math.floor((baseProduction + Math.random() * 20) * monthFactor * daysInMonth[month]);

        for (let i = 0; i < panelsThisMonth; i++) {
            const date = new Date(year, month, Math.floor(Math.random() * daysInMonth[month]) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
            
            const systemType = Math.random() > 0.45 ? 'el' : 'ir';
            const relevantDefectsList = systemType === 'el' ? EL_DEFECT_TYPES : IR_DEFECT_TYPES;

            const hasDefects = Math.random() < defectRate;
            const defects = !hasDefects ? [] : Array.from({ length: Math.ceil(Math.random() * 3) }, () => {
                const type = relevantDefectsList[Math.floor(Math.random() * relevantDefectsList.length)];
                return { type: type.name, severity: type.severity, location: { x: Math.random() * 90, y: Math.random() * 90, w: Math.random() * 10 + 5, h: Math.random() * 10 + 5 } };
            });

            panels.push({
              id: (year * 1000000) + (month * 10000) + i,
              serial_number: `SN-${systemType.toUpperCase()}-${String(year * 100000 + i).padStart(8, '0')}`,
              timestamp: date.toISOString(),
              health_score: hasDefects ? (95 - Math.random() * 10) : (98 + Math.random() * 2),
              status: hasDefects ? 'failed' : 'passed',
              image_url: `https://placehold.co/600x400/0f172a/FFF?text=Panel-${i}`,
              defects,
              type: systemType, 
              acknowledged: hasDefects ? Math.random() > 0.5 : true,
            });
        }
    }
    DB_CACHE[year] = panels;
    return panels;
};

// Replace original data with processed data (Arabic defect types mapped to English keys)
const REALISTIC_PANELS_RAW = [
    { "id": 2001, "type": "el", "serial_number": "SN-H7-20240118", "timestamp": "2024-05-21T14:22:15Z", "image_url": "https://github.com/hackingmaterials/pv-vision/blob/main/examples/object_detection/transformed_img/example_2.png?raw=true", "health_score": 97.4, "status": "failed", "defects": [ { "type": "كسر خلايا", "location": { "x": 94, "y": 5, "w": 6, "h": 12 } }, { "type": "كسر خلايا", "location": { "x": 94, "y": 72, "w": 6, "h": 12 } }, { "type": "كسر خلايا", "location": { "x": 94, "y": 26, "w": 6, "h": 12 } }, { "type": "تآكل موصلات", "location": { "x": 42, "y": 85, "w": 6, "h": 10 } }, { "type": "تآكل موصلات", "location": { "x": 49, "y": 85, "w": 6, "h": 10 } } ] },
    { "id": 2002, "type": "el", "serial_number": "SN-H7-20240119", "timestamp": "2024-05-21T14:20:58Z", "image_url": "https://github.com/hackingmaterials/pv-vision/blob/main/examples/object_detection/transformed_img/example_14.png?raw=true", "health_score": 92.6, "status": "failed", "defects": [ { "type": "كسر خلايا", "location": { "x": 68.6, "y": 5, "w": 6.5, "h": 10.5 } }, { "type": "تآكل موصلات", "location": { "x": 94, "y": 37, "w": 6, "h": 12 } } ] },
    { "id": 2003, "type": "el", "serial_number": "SN-H7-20240120", "timestamp": new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(), "image_url": "https://github.com/hackingmaterials/pv-vision/blob/main/examples/object_detection/transformed_img/example_6.png?raw=true", "health_score": 98.9, "status": "failed", "defects": [ { "type": "كسر خلايا", "location": { "x": 69, "y": 0, "w": 7, "h": 11 } }, { "type": "تآكل موصلات", "location": { "x": 88, "y": 62, "w": 7, "h": 13 } }, { "type": "تآكل موصلات", "location": { "x": 37, "y": 88, "w": 7, "h": 11 } } ] },
    { "id": 2004, "type": "el", "serial_number": "SN-H7-20240121", "timestamp": new Date(new Date().setDate(new Date().getDate() - 8)).toISOString(), "image_url": "https://github.com/hackingmaterials/pv-vision/blob/main/examples/object_detection/transformed_img/example_1.png?raw=true", "health_score": 99.8, "status": "passed", "defects": [] },
    { "id": 2005, "type": "el", "serial_number": "SN-H7-20240122", "timestamp": new Date().toISOString(), "image_url": "https://github.com/hackingmaterials/pv-vision/blob/main/examples/object_detection/transformed_img/example_8.png?raw=true", "health_score": 94.1, "status": "failed", "defects": [ { "type": "كسر خلايا", "location": { "x": 0, "y": 50, "w": 6, "h": 11 } }, { "type": "تآكل موصلات", "location": { "x": 37, "y": 88, "w": 6, "h": 12 } } ] },
    { "id": 2006, "type": "el", "serial_number": "SN-H7-20240123", "timestamp": new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), "image_url": "https://github.com/hackingmaterials/pv-vision/blob/main/examples/object_detection/transformed_img/example_3.png?raw=true", "health_score": 100.0, "status": "passed", "defects": [] },
    { "id": 3002, "type": "ir", "serial_number": "SN-IR-20240219", "timestamp": "2024-05-21T14:20:58Z", "image_url": "https://user-images.githubusercontent.com/32656910/210141635-227571d8-7956-42f1-a128-3b035a14d593.png?raw=true", "health_score": 92.6, "status": "failed", "defects": [ { "type": "cell", "location": { "x": 24, "y": 26, "w": 12, "h": 18 } } ] },
    { "id": 3004, "type": "ir", "serial_number": "SN-IR-20240221", "timestamp": new Date(new Date().setDate(new Date().getDate() - 8)).toISOString(), "image_url": "https://user-images.githubusercontent.com/32656910/210141662-7901e138-ac7e-4074-b52a-9f57f607d738.png?raw=true", "health_score": 99.8, "status": "passed", "defects": [] },
    { "id": 3006, "type": "ir", "serial_number": "SN-IR-20240223", "timestamp": new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), "image_url": "https://user-images.githubusercontent.com/32656910/210141695-94ac325e-336e-4f10-9755-257a3e743a6d.png?raw=true", "health_score": 100.0, "status": "passed", "defects": [] }
];
const REALISTIC_PANELS = REALISTIC_PANELS_RAW.map(panel => ({
    ...panel,
    defects: panel.defects.map(defect => {
        const typeName = USER_DEFECT_AR_TO_NAME_MAP[defect.type] || defect.type;
        const defectInfo = ALL_DEFECT_MAP[typeName];
        return {
            type: typeName,
            severity: defectInfo?.severity || 'medium',
            location: defect.location
        };
    })
}));


const fetchDashboardData = async ({ dateRange, year, systemType, lang }) => {
  await new Promise(res => setTimeout(res, 500));
  
  const ALL_PANELS_FOR_YEAR = generateYearlyData(year);

  const systemFilteredPanels = systemType === 'all' 
    ? ALL_PANELS_FOR_YEAR 
    : ALL_PANELS_FOR_YEAR.filter(p => p.type === systemType);

  const { start, end } = dateRange;
  const filteredPanels = systemFilteredPanels.filter(p => {
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

  const defectCounts = filteredPanels.reduce((acc, p) => {
    p.defects.forEach(d => { acc[d.type] = (acc[d.type] || 0) + 1; });
    return acc;
  }, {});
  
  const sortedDefects = Object.entries(defectCounts)
    .map(([name, count]) => ({
      count,
      name: ALL_DEFECT_MAP[name]?.[lang] || name,
      color: ALL_DEFECT_MAP[name]?.color || '#FFFFFF',
      severity: ALL_DEFECT_MAP[name]?.severity || 'low',
    }))
    .sort((a, b) => b.count - a.count);

  const totalDefects = sortedDefects.reduce((sum, d) => sum + d.count, 0);
  let cumulativeCount = 0;
  const paretoData = sortedDefects.map(d => {
    cumulativeCount += d.count;
    return {
      ...d,
      cumulativePercentage: totalDefects > 0 ? (cumulativeCount / totalDefects) * 100 : 0,
    };
  }).slice(0, 7);
  
  const locale = lang === 'ar' ? arSA : enUS;
  const productionData = {};
  const durationInDays = (end - start) / (1000 * 60 * 60 * 24);

  if (durationInDays <= 1) { 
      filteredPanels.forEach(p => {
        const hourKey = format(new Date(p.timestamp), 'yyyy-MM-dd-HH');
        if(!productionData[hourKey]) {
            productionData[hourKey] = { date: format(new Date(p.timestamp), 'ha', { locale }), inspected: 0, defects: 0, sortKey: new Date(p.timestamp) };
        }
        productionData[hourKey].inspected += 1;
        if (p.status === 'failed') productionData[hourKey].defects += 1;
      });
  } else if (durationInDays > 62) { 
      filteredPanels.forEach(p => {
        const monthKey = format(new Date(p.timestamp), 'yyyy-MM');
        if(!productionData[monthKey]) {
            productionData[monthKey] = { date: format(new Date(p.timestamp), 'MMM', { locale }), inspected: 0, defects: 0, sortKey: new Date(p.timestamp) };
        }
        productionData[monthKey].inspected += 1;
        if (p.status === 'failed') productionData[monthKey].defects += 1;
      });
  } else { 
      filteredPanels.forEach(p => {
        const dayKey = format(new Date(p.timestamp), 'yyyy-MM-dd');
        if(!productionData[dayKey]) {
            productionData[dayKey] = { date: format(new Date(p.timestamp), 'MMM d', { locale }), inspected: 0, defects: 0, sortKey: new Date(p.timestamp) };
        }
        productionData[dayKey].inspected += 1;
        if (p.status === 'failed') productionData[dayKey].defects += 1;
      });
  }
  
  const sortedProductionData = Object.values(productionData).sort((a,b) => a.sortKey - b.sortKey);

  const defect_rate = total_panels > 0 ? (failed_panels / total_panels) * 100 : 0;
  const hours = (end - start) / (1000 * 60 * 60);
  const throughput_per_hour = hours > 0 ? (total_panels / hours) : 0;

  return {
    stats: { total_panels, passed_panels, failed_panels, conformance_rate: total_panels > 0 ? (passed_panels / total_panels) * 100 : 100, defect_rate, throughput_per_hour, },
    criticalAlerts: criticalAlerts.map(p => {
        const criticalDefect = p.defects.find(d => d.severity === 'critical' || d.severity === 'high');
        const defectName = ALL_DEFECT_MAP[criticalDefect?.type]?.[lang] || translations.critical_defect[lang];
        return { id: p.id, serial_number: p.serial_number, defect_type: defectName, created_at: p.timestamp };
    }),
    fullDefectData: sortedDefects, paretoData, productionData: sortedProductionData,
  };
};

const StatCard = ({ title, value, subtext, icon, color }) => ( <div className="bg-[#1E293B] rounded-2xl p-5 border border-gray-700 flex items-center justify-between"><div><p className="text-gray-400 text-sm">{title}</p><p className={`text-2xl font-bold ${color}`}>{value}</p><p className={`text-xs text-gray-400`}>{subtext}</p></div><div className={`p-3 bg-gray-700/50 rounded-xl`}>{icon}</div></div> );

export default function HaseenApp() {
  const [lang, setLang] = useState('ar');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainSidebarCollapsed, setMainSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState("gallery");

  const t = (key) => translations[key]?.[lang] || key;
  const dateLocale = lang === 'ar' ? arSA : enUS;

  const navigateTo = (page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };
  
  const toggleLang = () => {
    setLang(prevLang => prevLang === 'ar' ? 'en' : 'ar');
  };
  
  const PAGE_INFO = {
    dashboard: { main: t('dashboard_main'), sub: t('dashboard_sub') },
    live_el: { main: t('live_el_main'), sub: t('live_el_sub') },
    live_ir: { main: t('live_ir_main'), sub: t('live_ir_sub') },
    gallery: { main: t('gallery_main'), sub: t('gallery_sub') },
    ai_test: { main: t('ai_test_main'), sub: t('ai_test_sub') }
  };

  const NavLink = ({ page, text, icon, currentPage, navigateTo, collapsed }) => ( <li><button onClick={() => navigateTo(page)} className={`w-full flex items-center gap-4 py-3 px-4 rounded-xl transition-all duration-300 relative ${collapsed ? 'justify-center' : ''} ${ currentPage === page ? "bg-sky-500/10 text-sky-400" : "hover:bg-gray-700/50 text-gray-400 hover:text-white" }`}>{currentPage === page && !collapsed && <div className={`absolute top-0 bottom-0 w-1 bg-sky-400 rounded-s-md ${lang === 'ar' ? 'left-0' : 'right-0'}`}></div>}{icon(currentPage === page ? "text-sky-400" : "text-gray-400")}<span className={`transition-opacity duration-200 whitespace-nowrap ${collapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100'}`}>{text}</span></button></li> );

  return (
    <LanguageContext.Provider value={{ lang, t, dateLocale }}>
      <div className="flex h-screen overflow-hidden text-sm text-gray-300 bg-[#0F172A] font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <style jsx global>{` @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap'); .status-indicator { animation: pulse 2s infinite; } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } } `}</style>
        <aside className={`bg-[#1E293B] ${lang === 'ar' ? 'border-l' : 'border-r'} border-gray-700 z-50 flex flex-col transition-all duration-300 ${mainSidebarCollapsed ? "w-20" : "w-64"}`}>
          <div className={`pt-6 pb-4 px-4 border-b border-gray-700 flex items-center ${mainSidebarCollapsed ? 'justify-center' : 'justify-between'}`}><div className={`flex items-center gap-3 transition-all duration-300 overflow-hidden ${mainSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}><div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center flex-shrink-0"><Shield size={24} className="text-white" /></div><div><h2 className="font-bold text-xl text-white whitespace-nowrap">{t('system_name')}</h2><p className="text-xs text-gray-400 whitespace-nowrap">{t('system_subtitle')}</p></div></div><button onClick={() => setMainSidebarCollapsed(!mainSidebarCollapsed)} className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0">{mainSidebarCollapsed ? (lang === 'ar' ? <ChevronsLeft size={20} className="text-gray-400" /> : <ChevronsRight size={20} className="text-gray-400" />) : <Menu size={20} className="text-gray-400" />}</button></div>
            <nav className="px-4 py-4 flex-1">
              <ul className="space-y-2">
                  <NavLink page="dashboard" text={t('nav_dashboard')} icon={className => <Activity size={20} className={className}/>} currentPage={currentPage} navigateTo={navigateTo} collapsed={mainSidebarCollapsed} />
                  <NavLink page="live_el" text={t('nav_live_el')} icon={className => <Target size={20} className={className}/>} currentPage={currentPage} navigateTo={navigateTo} collapsed={mainSidebarCollapsed} />
                  <NavLink page="live_ir" text={t('nav_live_ir')} icon={className => <Thermometer size={20} className={className}/>} currentPage={currentPage} navigateTo={navigateTo} collapsed={mainSidebarCollapsed} />
                  <NavLink page="gallery" text={t('nav_gallery')} icon={className => <Database size={20} className={className}/>} currentPage={currentPage} navigateTo={navigateTo} collapsed={mainSidebarCollapsed} />
                  <NavLink page="ai_test" text={t('nav_ai_test')} icon={className => <Cpu size={20} className={className}/>} currentPage={currentPage} navigateTo={navigateTo} collapsed={mainSidebarCollapsed} />
                  <NavLink page="settings" text={t('nav_settings')} icon={className => <Settings size={20} className={className}/>} currentPage={currentPage} navigateTo={() => alert("Settings page not implemented yet.")} collapsed={mainSidebarCollapsed} />
              </ul>
            </nav>
            <div className={`p-4 border-t border-gray-700 transition-opacity ${mainSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}><div className="bg-gray-700/50 p-3 rounded-lg text-center"><p className="text-xs text-gray-400">{t('system_version')}</p><p className="text-sm font-semibold text-white">{t('version_number')}</p></div></div>
        </aside>
        
        <section className="flex-1 flex flex-col min-w-0">
          <header className="h-20 px-6 flex items-center justify-between border-b border-gray-700 bg-[#1E293B] flex-shrink-0"><div><h1 className="text-xl font-bold text-white">{PAGE_INFO[currentPage]?.main || t('system_name')}</h1>{PAGE_INFO[currentPage]?.sub && ( <p className="text-sm font-normal text-gray-400">{PAGE_INFO[currentPage].sub}</p> )}</div><div className="flex items-center gap-4"><button 
  onClick={toggleLang} 
  className="w-10 h-10 flex items-center justify-center bg-transparent hover:bg-gray-700 rounded-lg transition-colors text-sm font-bold text-gray-300 border border-gray-700 hover:border-gray-600"
  aria-label="Change language"
>
  {lang === 'ar' ? 'EN' : 'AR'}
</button><button className="p-2 hover:bg-gray-700 rounded-lg transition-colors relative"><Bell size={18} className="text-gray-400" /><span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1E293B]"></span></button><div className="w-px h-8 bg-gray-700"></div><div className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/50 rounded-lg p-2 transition-colors"><div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"><span className="text-white text-sm font-bold">{lang === 'ar' ? 'م' : 'O'}</span></div><div className="hidden sm:block"><p className="font-semibold text-white">{t('operator_name')}</p><p className="text-xs text-gray-400">{t('operator_role')}</p></div><ChevronDown size={16} className="text-gray-400 hidden sm:block" /></div></div></header>

          {currentPage === 'dashboard' && <DashboardPage />}
          {currentPage === 'live_el' && <ProductionLinePage lineType="el" />}
          {currentPage === 'live_ir' && <ProductionLinePage lineType="ir" />}
          {currentPage === 'gallery' && <GalleryPage />}
          {currentPage === 'ai_test' && <AIModelTestPage />}
        </section>
      </div>
    </LanguageContext.Provider>
  );
}

function DashboardPage() {
    const { lang, t, dateLocale } = useLang();
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [activePreset, setActivePreset] = useState('month');
    const [defectView, setDefectView] = useState('pareto');
    
    const [systemType, setSystemType] = useState('all');
    const [dateRange, setDateRange] = useState({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) });

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['dashboardData', dateRange, selectedYear, systemType, lang],
        queryFn: () => fetchDashboardData({ dateRange, year: selectedYear, systemType, lang }),
        keepPreviousData: true,
    });
    
    useEffect(() => { setDatePreset('month'); }, [selectedYear]);

    const setDatePreset = (preset) => {
        setActivePreset(preset);
        const today = new Date();
        const referenceDate = today.getFullYear() === selectedYear ? today : new Date(selectedYear, 0, 1);
        let start, end;
        if (preset === 'today') { start = startOfDay(referenceDate); end = endOfDay(referenceDate); } 
        else if (preset === 'week') { start = startOfWeek(referenceDate, { locale: dateLocale }); end = endOfWeek(referenceDate, { locale: dateLocale }); } 
        else if (preset === 'month') { start = startOfMonth(referenceDate); end = endOfMonth(referenceDate); }
        setDateRange({ start, end });
    };

    const handleYearChange = (year) => { setSelectedYear(year); setActivePreset(null); setDateRange({ start: startOfYear(new Date(year, 0, 1)), end: endOfYear(new Date(year, 0, 1)) }); }
    const dateDisplay = useMemo(() => { if (!dateRange.start || !dateRange.end) return t('choose_date'); if (activePreset === null) { return `${t('year_display')} ${selectedYear}`; } const formatString = "d MMMM yyyy"; const startStr = format(dateRange.start, formatString, { locale: dateLocale }); const endStr = format(dateRange.end, formatString, { locale: dateLocale }); if(startStr === endStr) return startStr; return `${format(dateRange.start, 'd MMMM', { locale: dateLocale })} - ${endStr}`; }, [dateRange, activePreset, selectedYear, dateLocale, t]);

    if (isLoading) return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>
    if (isError) return <div className="flex h-full items-center justify-center text-red-400">Error loading data.</div>

    return (
        <main className="flex-1 overflow-y-auto p-6 bg-[#0F172A]">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center bg-[#1E293B] rounded-xl border border-gray-600 p-1"><button onClick={() => setSystemType('el')} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${systemType === 'el' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>EL</button><button onClick={() => setSystemType('ir')} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${systemType === 'ir' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>IR</button><button onClick={() => setSystemType('all')} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${systemType === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>{t('all')}</button></div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] rounded-xl border border-gray-600 min-w-[280px]"><Calendar size={16} className="text-gray-400" /><span className="font-medium text-white">{dateDisplay}</span></div>
                    <div className="flex items-center bg-[#1E293B] rounded-xl border border-gray-600 p-1"><button onClick={() => setDatePreset('today')} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === 'today' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>{t('today')}</button><button onClick={() => setDatePreset('week')} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === 'week' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>{t('week')}</button><button onClick={() => setDatePreset('month')} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === 'month' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>{t('month')}</button></div>
                    <div className="flex items-center bg-[#1E293B] rounded-xl border border-gray-600 p-1"><button onClick={() => handleYearChange(currentYear)} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === null && selectedYear === currentYear ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>{currentYear}</button><button onClick={() => handleYearChange(currentYear - 1)} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === null && selectedYear === (currentYear - 1) ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>{currentYear - 1}</button></div>
                </div>
                <button onClick={() => refetch()} className="p-2 bg-[#1E293B] rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"><RefreshCw size={18} className="text-gray-400" /></button>
            </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-5 mb-6"><StatCard title={t('stat_total')} value={data?.stats?.total_panels.toLocaleString() || 0} subtext={t('solar_panel_unit')} icon={<Activity size={24} className="text-blue-400" />} color="text-white"/><StatCard title={t('stat_passed')} value={data?.stats?.passed_panels.toLocaleString() || 0} subtext={t('panel_unit')} icon={<CheckCircle size={24} className="text-green-400" />} color="text-green-400"/><StatCard title={t('stat_failed')} value={data?.stats?.failed_panels.toLocaleString() || 0} subtext={t('panel_unit')} icon={<XCircle size={24} className="text-red-400" />} color="text-red-400"/><StatCard title={t('stat_conformance')} value={`${Number(data?.stats?.conformance_rate || 0).toFixed(1)}%`} subtext={t('passed_production_ratio')} icon={<TrendingUp size={24} className="text-cyan-400" />} color="text-cyan-400"/><StatCard title={t('stat_defect_rate')} value={`${Number(data?.stats?.defect_rate || 0).toFixed(1)}%`} subtext={t('failed_production_ratio')} icon={<AlertTriangle size={24} className="text-orange-400" />} color="text-orange-400"/></div>
            <div className="flex justify-center mb-6">
                <div className="w-full max-w-2xl bg-[#1E293B] rounded-2xl border border-gray-700 p-2 flex flex-row items-stretch">
                    {lang === 'en' && (
                        <>
                            <div className="flex-1 flex items-center justify-between bg-slate-900/50 rounded-s-lg px-6 py-4">
                                <span className="text-2xl font-bold text-white">{Number(data?.stats?.throughput_per_hour || 0).toFixed(1)}</span>
                                <div className="flex items-center gap-3 text-gray-300"><Gauge size={20} /><span className="text-base">{t('throughput_per_hour')}</span></div>
                            </div>
                            <div className="flex-1 flex items-center justify-between bg-slate-900/50 rounded-e-lg px-6 py-4 border-s border-slate-700">
                                <span className="text-2xl font-bold text-purple-400">97.4%</span>
                                <div className="flex items-center gap-3 text-gray-300"><Cpu size={20} className="text-purple-400" /><span className="text-base">{t('model_accuracy')}</span></div>
                            </div>
                        </>
                    )}
                    {lang === 'ar' && (
                        <>
                            <div className="flex-1 flex items-center justify-between bg-slate-900/50 rounded-s-lg px-6 py-4">
                                <span className="text-2xl font-bold text-white">{Number(data?.stats?.throughput_per_hour || 0).toFixed(1)}</span>
                                <div className="flex items-center gap-3 text-gray-300"><Gauge size={20} /><span className="text-base">{t('throughput_per_hour')}</span></div>
                            </div>
                            <div className="flex-1 flex items-center justify-between bg-slate-900/50 rounded-e-lg px-6 py-4 border-s border-slate-700">
                                <span className="text-2xl font-bold text-purple-400">97.4%</span>
                                <div className="flex items-center gap-3 text-gray-300"><Cpu size={20} className="text-purple-400" /><span className="text-base">{t('model_accuracy')}</span></div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2"><div className="bg-[#1E293B] rounded-2xl p-6 border border-gray-700"><h3 className="text-lg font-semibold text-white mb-4">{t('production_overview')}</h3><div className="h-96"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data?.productionData} margin={{ top: 5, right: lang === 'ar' ? 20 : 0, left: lang === 'ar' ? -10 : 10, bottom: 5 }}><defs><linearGradient id="colorInspected" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38BDF8" stopOpacity={0.8}/><stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} /><YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} /><Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }} /><Area type="monotone" dataKey="inspected" name={t('inspected_chart')} stroke="#38BDF8" fillOpacity={1} fill="url(#colorInspected)" /><Area type="monotone" dataKey="defects" name={t('defective_chart')} stroke="#EF4444" fill="transparent" /></AreaChart></ResponsiveContainer></div></div><div className="bg-[#1E293B] rounded-2xl p-6 border border-gray-700 flex flex-col"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-white">{t('defect_analysis_center')}</h3><div className="flex items-center bg-[#0F172A] rounded-lg border border-gray-600 p-1"><button onClick={() => setDefectView('pareto')} className={`px-2 py-1 rounded-md text-xs transition-colors flex items-center gap-1 ${defectView === 'pareto' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}><LineChart size={14}/> <span>{t('impact')}</span></button><button onClick={() => setDefectView('full')} className={`px-2 py-1 rounded-md text-xs transition-colors flex items-center gap-1 ${defectView === 'full' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}><BarChart3 size={14}/> <span>{t('all')}</span></button></div></div><div className="flex-1 h-96">{data?.fullDefectData && data.fullDefectData.length > 0 ? ( <ResponsiveContainer width="100%" height="100%">{defectView === 'pareto' ? ( <ComposedChart data={data.paretoData} margin={{ top: 5, right: lang === 'ar' ? 5 : 25, left: lang === 'ar' ? -25 : 5, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9CA3AF" }} angle={-25} textAnchor="end" height={40} /><YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#9CA3AF" }} orientation={lang === 'ar' ? 'left' : 'right'} /><YAxis yAxisId="right" orientation={lang === 'ar' ? "right" : "left"} tickFormatter={(tick) => `${tick}%`} tick={{ fontSize: 10, fill: "#f97316" }} /><Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }} /><Bar yAxisId="left" dataKey="count" name={t('count_chart')} fill="#38BDF8" /><Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" name={t('cumulative_perc_chart')} stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} /></ComposedChart> ) : ( <BarChart layout="vertical" data={data.fullDefectData} margin={{ top: 5, right: lang === 'ar' ? 20 : 10, left: lang === 'ar' ? 10 : 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} /><YAxis type="category" dataKey="name" width={lang === 'ar' ? 80 : 120} tick={{ fontSize: 10, fill: "#9CA3AF" }} /><Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }} cursor={{ fill: '#374151' }}/><Bar dataKey="count" name={t('count_chart')}>{data.fullDefectData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.color} /> ))}</Bar></BarChart> )}</ResponsiveContainer> ) : <p className="text-sm text-gray-500 text-center py-4">{t('no_defect_data')}</p>}</div></div></div>
        </main>
    );
}

function ProductionLinePage({ lineType }) {
    const { lang, t, dateLocale } = useLang();
    const [panelIndex, setPanelIndex] = useState(0);
    const [alerts, setAlerts] = useState([]);
    const [isFading, setIsFading] = useState(false);
    
    const activePanels = useMemo(() => REALISTIC_PANELS.filter(p => p.type === lineType), [lineType]);
    const currentPanel = activePanels[panelIndex];

    useEffect(() => {
        setPanelIndex(0);
        const firstPanel = activePanels[0];
        if (firstPanel && firstPanel.status === 'failed') {
            const message = lang === 'ar' ? `${t('num_defects_detected')} ${firstPanel.defects.length} ${t('defects_detected')}` : `${firstPanel.defects.length} ${t('defects_detected')}`;
            setAlerts([{ id: firstPanel.id + Math.random(), serial_number: firstPanel.serial_number, message, timestamp: new Date().toISOString(), acknowledged: false }]);
        } else {
            setAlerts([]);
        }
    }, [lineType, activePanels, lang, t]);
    
    useEffect(() => {
        if (activePanels.length === 0) return;
        const interval = setInterval(() => {
            setIsFading(true);
            setTimeout(() => {
                setPanelIndex(prevIndex => {
                    const nextIndex = (prevIndex + 1) % activePanels.length;
                    const nextPanel = activePanels[nextIndex];
                    if (nextPanel.status === 'failed') {
                        setAlerts(prevAlerts => {
                            const alertExists = prevAlerts.some(alert => alert.serial_number === nextPanel.serial_number);
                            if (!alertExists) {
                                const message = lang === 'ar' ? `${t('num_defects_detected')} ${nextPanel.defects.length} ${t('defects_detected')}` : `${nextPanel.defects.length} ${t('defects_detected')}`;
                                const newAlert = { id: nextPanel.id + Math.random(), serial_number: nextPanel.serial_number, message, timestamp: new Date().toISOString(), acknowledged: false };
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
    }, [activePanels, lang, t]);
    
    const acknowledgeAlert = (id) => { setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a)); };

    return (
        <div className="flex-1 flex overflow-hidden">
            <aside className={`w-80 bg-[#1E293B] ${lang === 'ar' ? 'border-r' : 'border-l'} border-gray-700 flex flex-col flex-shrink-0`}>
                <h3 className="text-lg font-semibold text-white p-6 border-b border-gray-700 flex-shrink-0">{t('realtime_alerts')}</h3>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-col gap-4">
                        {alerts.map(alert => (
                            <div key={alert.id} className={`w-full p-4 rounded-xl border transition-all duration-300 ${alert.acknowledged ? 'bg-gray-700/30 border-gray-600' : 'bg-orange-500/10 border-orange-500/30'}`}>
                                <div className="flex flex-col h-full"><div className="flex items-center gap-3 mb-2"><AlertTriangle size={18} className={`${alert.acknowledged ? 'text-gray-500' : 'text-orange-400'}`}/><p className="font-mono text-sm text-white flex-1">{alert.serial_number}</p>{!alert.acknowledged && <div className={`w-2.5 h-2.5 rounded-full bg-orange-400 status-indicator`}></div>}</div><p className="text-xs text-gray-300 flex-1">{alert.message}</p><div className="flex items-end justify-between mt-3"><p className="text-xs text-gray-400">{new Date(alert.timestamp).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US')}</p>{alert.acknowledged ? ( <div className="flex items-center gap-1 text-xs text-green-400"><CheckCircle size={14}/><span>{t('acknowledged')}</span></div> ) : ( <button onClick={() => acknowledgeAlert(alert.id)} className="text-xs text-blue-300 hover:text-white whitespace-nowrap bg-blue-600/50 hover:bg-blue-600 px-3 py-1 rounded-md transition-colors">{t('acknowledge')}</button> )}</div></div>
                            </div>
                        ))}
                        {alerts.length === 0 && ( <div className="text-center py-8 h-full flex flex-col justify-center w-full"><CheckCircle size={48} className="text-green-400 mx-auto mb-2"/><p className="text-gray-400">{t('no_new_alerts')}</p></div> )}
                    </div>
                </div>
            </aside>
            <main className="flex-1 flex flex-col p-6 bg-[#0F172A] gap-6 overflow-hidden">
                <div className="flex-1 bg-[#1E293B] rounded-2xl p-6 border border-gray-700 flex flex-col min-h-0">
                    <div className="flex-1 w-full flex items-center justify-center min-h-0 py-2">
                        <div className="h-full max-w-full aspect-video mx-auto bg-black rounded-lg relative overflow-hidden shadow-2xl shadow-black/50">
                            {currentPanel ? ( <>
                                <img key={currentPanel.id} src={currentPanel.image_url} alt={`Solar Panel ${currentPanel.serial_number}`} className={`h-full w-full object-contain transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                                {currentPanel.defects.map((defect, i) => {
                                    const defectInfo = ALL_DEFECT_MAP[defect.type];
                                    if(!defectInfo) return null;
                                    return (<div key={i} className="absolute border-2 rounded-sm" style={{ borderColor: defectInfo.color, boxShadow: `0 0 15px ${defectInfo.color}`, left: `${defect.location.x}%`, top: `${defect.location.y}%`, width: `${defect.location.w}%`, height: `${defect.location.h}%`, opacity: isFading ? 0 : 1, transition: 'opacity 0.5s' }}><span className={`absolute -top-6 ${lang === 'ar' ? '-right-1' : '-left-1'} text-xs px-2 py-0.5 rounded-md font-semibold text-white whitespace-nowrap`} style={{ backgroundColor: defectInfo.color }}>{defectInfo[lang]}</span></div>);
                                })}
                            </> ) : ( <div className="text-center text-gray-400 p-8"><ImageIcon size={48} className="mx-auto mb-2"/><p>{t('initializing_inspection')}</p></div> )}
                        </div>
                    </div>
                    {currentPanel && (
                        <div className={`mt-4 bg-[#0F172A] border border-gray-700 rounded-xl p-3 grid grid-cols-4 gap-4 text-center w-full max-w-4xl mx-auto transition-opacity duration-500 flex-shrink-0 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                            <div><p className="text-xs text-gray-400">{t('serial_number')}</p><p className="font-mono text-white text-base">{currentPanel.serial_number}</p></div>
                            <div><p className="text-xs text-gray-400">{t('inspection_time')}</p><p className="font-mono text-white text-base">{new Date().toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US')}</p></div>
                            <div><p className="text-xs text-gray-400">{t('health_score')}</p><p className={`font-bold text-xl ${currentPanel.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>{currentPanel.health_score.toFixed(1)}%</p></div>
                            <div><p className="text-xs text-gray-400">{t('result')}</p><p className={`font-bold text-xl ${currentPanel.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>{currentPanel.status === 'passed' ? t('passed') : t('failed')}</p></div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

const GalleryCard = ({ panel }) => {
  const { lang, t, dateLocale } = useLang();
  return ( <div className="bg-[#1E293B] rounded-2xl p-4 border border-gray-700 flex flex-col gap-4"><div className="aspect-video bg-black rounded-lg relative overflow-hidden"><img src={panel.image_url} alt={`Panel ${panel.serial_number}`} className="h-full w-full object-contain" />{panel.defects.map((defect, i) => {
      const defectInfo = ALL_DEFECT_MAP[defect.type];
      return (<div key={i} className="absolute border-2 rounded-sm opacity-90" style={{ borderColor: defectInfo?.color, boxShadow: `0 0 8px ${defectInfo?.color}`, left: `${defect.location.x}%`, top: `${defect.location.y}%`, width: `${defect.location.w}%`, height: `${defect.location.h}%` }}></div>)
    })}<span className={`absolute top-2 ${lang === 'ar' ? 'right-2' : 'left-2'} text-xs font-bold px-2 py-1 rounded-full text-white ${panel.type === 'el' ? 'bg-sky-500/80' : 'bg-rose-500/80'}`}>{panel.type.toUpperCase()}</span></div><div><div className="flex justify-between items-center mb-2"><p className="font-mono text-base text-blue-400">{panel.serial_number}</p><div className="flex items-center gap-1 text-xs text-gray-400"><Calendar size={14} /><span>{new Date(panel.timestamp).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div></div><div className="flex justify-between items-center gap-4 pt-3 border-t border-gray-700/50"><div className="text-center"><p className="text-xs text-gray-400">{t('result')}</p><p className={`font-bold text-lg ${panel.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>{panel.status === 'passed' ? t('passed') : t('failed')}</p></div><div className="text-center"><p className="text-xs text-gray-400">{t('health_score')}</p><p className={`font-bold text-lg ${panel.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>{panel.health_score.toFixed(1)}%</p></div><div className="text-center"><p className="text-xs text-gray-400">{t('defects_count')}</p><p className="font-bold text-lg text-white">{panel.defects.length}</p></div></div></div></div> );
};

function GalleryPage() {
    const { lang, t, dateLocale } = useLang();
    const [searchTerm, setSearchTerm] = useState('');
    const [activePreset, setActivePreset] = useState('all');
    const [activeSystem, setActiveSystem] = useState('all');

    const filteredPanels = useMemo(() => {
        const now = new Date();
        let start, end;
        switch (activePreset) { case 'today': start = startOfDay(now); end = endOfDay(now); break; case 'week': start = startOfWeek(now, { locale: dateLocale }); end = endOfWeek(now, { locale: dateLocale }); break; case 'month': start = startOfMonth(now); end = endOfMonth(now); break; default: start = null; end = null; break; }
        return REALISTIC_PANELS.filter(panel => {
                const matchesSearch = panel.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesSystem = activeSystem === 'all' || panel.type === activeSystem;
                const matchesDate = !start || (new Date(panel.timestamp) >= start && new Date(panel.timestamp) <= end);
                return matchesSearch && matchesSystem && matchesDate;
            }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [searchTerm, activePreset, activeSystem, dateLocale]); 

    return (
        <main className="flex-1 overflow-y-auto p-6 bg-[#0F172A]">
             <div className="flex justify-start items-center gap-4 mb-6 flex-wrap">
                <div className="relative max-w-sm"><input type="text" placeholder={t('search_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full bg-[#1E293B] border border-gray-600 rounded-lg py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}/><div className={`absolute inset-y-0 flex items-center pointer-events-none ${lang === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'}`}><Search size={18} className="text-gray-400" /></div></div>
                <div className="flex items-center bg-[#1E293B] rounded-xl border border-gray-600 p-1"><button onClick={() => setActiveSystem('el')} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${activeSystem === 'el' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>EL</button><button onClick={() => setActiveSystem('ir')} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${activeSystem === 'ir' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>IR</button><button onClick={() => setActiveSystem('all')} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${activeSystem === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>{t('all')}</button></div>
                <div className="flex items-center bg-[#1E293B] rounded-xl border border-gray-600 p-1"><button onClick={() => setActivePreset('today')} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === 'today' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>{t('today')}</button><button onClick={() => setActivePreset('week')} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === 'week' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>{t('week')}</button><button onClick={() => setActivePreset('month')} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === 'month' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>{t('month')}</button><button onClick={() => setActivePreset('all')} className={`px-3 py-1 rounded-lg text-xs transition-colors ${activePreset === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>{t('all')}</button></div>
             </div>
             {filteredPanels.length > 0 ? ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredPanels.map(panel => ( <GalleryCard key={panel.id} panel={panel} /> ))}</div> ) : ( <div className="text-center py-20"><Search size={48} className="text-gray-500 mx-auto mb-4" /><h3 className="text-xl font-semibold text-white">{t('no_results_found')}</h3><p className="text-gray-400 mt-2">{t('try_modifying_search')}</p></div> )}
        </main>
    );
}

const PREDEFINED_DEFECTS_SET_1 = [ { type: 'cell_crack', location: { x: 68.33, y: 39.5, w: 7, h: 10.5 } }, { type: 'cell_crack', location: { x: 94, y: 30, w: 6, h: 10.5 } }, { type: 'cell_crack', location: { x: 87.8, y: 58.5, w: 6, h: 10.5 } }, { type: 'cell_crack', location: { x: 12, y: 12.33, w: 6, h: 10 } }, { type: 'cell_crack', location: { x: 0.2, y: 60, w: 6, h: 8.5 } }, { type: 'cell_crack', location: { x: 0.17, y: 22.5, w: 6, h: 10.2} }, { type: 'cell_crack', location: { x: 94.3, y: 68, w: 6, h: 10.2 } }, { type: 'cell_crack', location: { x: 55.6, y: 58.5, w: 6, h: 10.2 } }, { type: 'cell_crack', location: { x: 5.83, y: 22.6, w: 6, h: 10.1 } }, { type: 'cell_crack', location: { x: 30, y: 40, w: 6, h: 10.2 } }, { type: 'cell_crack', location: { x: 81.4, y: 49, w: 6.4, h: 10.5 } }, { type: 'cell_crack', location: { x: 94.3, y: 49, w: 6, h: 10.5 } }, { type: 'cell_crack', location: { x: 12, y: 13, w: 6, h: 10.2 } }, { type: 'cell_crack', location: { x: 55.8, y: 30, w: 6.3, h: 10.5 } }, { type: 'cell_crack', location: { x: 11.75, y: 22.2, w: 6.2, h: 10.1 } }, { type: 'cell_crack', location: { x: 11.5, y: 50, w: 6, h: 10.2 } }, { type: 'cell_crack', location: { x: 55.5, y: 69, w: 6.2, h: 10 } }, { type: 'connector_corrosion', location: { x: 81.4, y: 49, w: 6.5, h: 10.5 } }, { type: 'connector_corrosion', location: { x: 36.17, y: 68.3, w: 6.5, h: 10 } }, { type: 'connector_corrosion', location: { x: 37, y: 20.7, w: 6, h: 10 } }, { type: 'connector_corrosion', location: { x: 55.83, y: 13, w: 6.7, h: 8.5 } } ];

function AIModelTestPage() {
    const { lang, t } = useLang();
    const [imageFile, setImageFile] = useState(null); const [imageUrl, setImageUrl] = useState(null); const [isProcessing, setIsProcessing] = useState(false); const [results, setResults] = useState(null); const [error, setError] = useState(null); const [uploadSequence, setUploadSequence] = useState(0); const fileInputRef = useRef(null);
    const handleFileChange = (file) => { if (!file) return; if (!file.type.startsWith('image/')) { setError(t('invalid_file_error')); return; } setError(null); setResults(null); setImageFile(file); setImageUrl(URL.createObjectURL(file)); setUploadSequence(prev => prev + 1); };
    const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files && e.dataTransfer.files[0]) { handleFileChange(e.dataTransfer.files[0]); } };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const runAIAnalysis = async () => { if (!imageFile) return; setIsProcessing(true); await new Promise(res => setTimeout(res, 2500)); const isDefectiveCase = uploadSequence % 2 !== 0; let newResults; if (isDefectiveCase) { newResults = { defects: PREDEFINED_DEFECTS_SET_1, status: 'failed', health_score: 91.5, }; } else { newResults = { defects: [], status: 'passed', health_score: 98.6, }; } setResults(newResults); setIsProcessing(false); };
    const resetState = () => { setImageFile(null); setImageUrl(null); setResults(null); setError(null); setIsProcessing(false); if (fileInputRef.current) { fileInputRef.current.value = ""; } };
    
    return (
        <main className="flex-1 overflow-y-auto p-6 bg-[#0F172A]">
            {!imageUrl ? ( <div onDrop={handleDrop} onDragOver={handleDragOver} className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-2xl text-center p-8"><UploadCloud size={64} className="text-gray-500 mb-4"/><h2 className="text-xl font-semibold text-white mb-2">{t('drop_image_title')}</h2><p className="text-gray-400 mb-6">{t('drop_image_subtitle')}</p><input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleFileChange(e.target.files[0])} className="hidden"/><button onClick={() => fileInputRef.current.click()} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">{t('select_file')}</button>{error && <p className="text-red-400 mt-4">{error}</p>}</div> ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    <div className="lg:col-span-2 bg-[#1E293B] rounded-2xl p-6 border border-gray-700 flex items-center justify-center"><div className="w-full h-full relative"><img src={imageUrl} alt="Uploaded Panel" className="w-full h-full object-contain" />{results && results.defects.map((defect, i) => {
                        const defectInfo = ALL_DEFECT_MAP[defect.type];
                        if(!defectInfo) return null;
                        return (<div key={i} className="absolute border-2 rounded-sm" style={{ borderColor: defectInfo.color, boxShadow: `0 0 15px ${defectInfo.color}`, left: `${defect.location.x}%`, top: `${defect.location.y}%`, width: `${defect.location.w}%`, height: `${defect.location.h}%`, }}><span className={`absolute -top-6 ${lang === 'ar' ? '-right-1' : '-left-1'} text-xs px-2 py-0.5 rounded-md font-semibold text-white whitespace-nowrap`} style={{ backgroundColor: defectInfo.color }}>{defectInfo[lang]}</span></div>)
                    })}</div></div>
                    <div className="bg-[#1E293B] rounded-2xl p-6 border border-gray-700 flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-4">{t('analysis_results')}</h3>
                        {isProcessing ? ( <div className="flex-1 flex flex-col items-center justify-center text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4"></div><p className="text-gray-300">{t('analyzing_image')}</p><p className="text-xs text-gray-500">{t('analysis_time_notice')}</p></div> ) : results ? ( <div className="flex-1 flex flex-col"><div className="grid grid-cols-2 gap-4 mb-6"><div className="bg-[#0F172A] p-4 rounded-lg text-center"><p className="text-sm text-gray-400">{t('result')}</p><p className={`text-2xl font-bold ${results.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>{results.status === 'passed' ? t('passed') : t('failed')}</p></div><div className="bg-[#0F172A] p-4 rounded-lg text-center"><p className="text-sm text-gray-400">{t('health_score')}</p><p className={`text-2xl font-bold ${results.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>{results.health_score.toFixed(1)}%</p></div></div><h4 className="font-semibold text-white mb-2">{t('detected_defects')}:</h4><div className="flex-1 overflow-y-auto pr-2">{results.defects.length > 0 ? ( (() => { const defectSummary = Object.values(results.defects.reduce((acc, defect) => { if (!acc[defect.type]) { const defectInfo = ALL_DEFECT_MAP[defect.type]; acc[defect.type] = { type: defectInfo?.[lang], color: defectInfo?.color, count: 0 }; } acc[defect.type].count++; return acc; }, {})); return ( <ul className="space-y-3 mt-2">{defectSummary.map((d, i) => ( <li key={i} className="flex justify-between items-center text-base p-2 rounded-lg"><div className="flex items-center gap-3"><span className="font-medium text-gray-200">{d.type}</span><span className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></span></div>{d.count > 1 && ( <span className="font-mono text-sm bg-slate-700 text-slate-300 px-2 py-1 rounded-lg">x{d.count}</span> )}</li> ))}</ul> ); })() ) : <p className="text-sm text-gray-500 mt-4">{t('no_defects_found')}</p>}</div></div> ) : ( <div className="flex-1 flex flex-col items-center justify-center text-center"><CheckCircle size={48} className="text-gray-500 mb-4"/><p className="text-gray-300">{t('image_ready')}</p><p className="text-xs text-gray-500">{t('click_start_analysis')}</p></div> )}
                        <div className="mt-auto pt-4 flex gap-4"><button onClick={resetState} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">{t('test_another_image')}</button><button onClick={runAIAnalysis} disabled={isProcessing || !imageFile} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">{isProcessing ? t('analyzing') : t('start_analysis')}</button></div>
                    </div>
                </div>
            )}
        </main>
    );
}