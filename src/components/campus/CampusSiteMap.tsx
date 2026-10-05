import React, { useState, useMemo } from 'react';
import { useSociety } from '../../context/SocietyContext';
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Home,
  Info,
  ArrowRight,
  Layers,
  MapPin,
  Sparkles,
  Droplets,
  Zap,
  ShieldAlert,
  Car,
} from 'lucide-react';
import { TowerId } from '../../types';

interface TowerOccupancyStats {
  tower: TowerId;
  wingNumber: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  approvedCount: number;
  pendingCount: number;
  ownersCount: number;
  tenantsCount: number;
  occupancyRate: number;
  statusBadge: {
    label: string;
    color: string;
    bg: string;
    border: string;
  };
}

export const CampusSiteMap: React.FC = () => {
  const { profiles, setActiveTab } = useSociety();

  const [selectedTower, setSelectedTower] = useState<TowerId>('Tower A');
  const [hoveredTower, setHoveredTower] = useState<TowerId | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'campus' | 'units'>('campus');

  // Compute live occupancy metrics for Towers A, B, and C strictly from resident database
  const towerStats = useMemo<Record<TowerId, TowerOccupancyStats>>(() => {
    const calculateForTower = (
      tower: TowerId,
      wingNumber: number,
      totalUnits = 60
    ): TowerOccupancyStats => {
      // Find all profiles for this tower that are not rejected
      const towerProfiles = profiles.filter(
        (p) => p.tower === tower && p.status !== 'Rejected'
      );

      // Unique occupied flats count
      const occupiedFlatNumbers = new Set(towerProfiles.map((p) => p.flatNo.toUpperCase()));
      const occupiedUnits = occupiedFlatNumbers.size;
      const vacantUnits = Math.max(0, totalUnits - occupiedUnits);

      const approvedCount = towerProfiles.filter((p) => p.isApproved).length;
      const pendingCount = towerProfiles.filter((p) => !p.isApproved || p.status === 'Pending Approval').length;
      const ownersCount = towerProfiles.filter((p) => p.ownershipType === 'Owner').length;
      const tenantsCount = towerProfiles.filter((p) => p.ownershipType === 'Tenant').length;

      const occupancyRate = Math.round((occupiedUnits / totalUnits) * 100);

      let statusBadge = {
        label: 'High Occupancy',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
      };

      if (occupancyRate < 40) {
        statusBadge = {
          label: 'Handover Active',
          color: 'text-amber-700',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
        };
      } else if (occupancyRate < 75) {
        statusBadge = {
          label: 'Moderate Occupancy',
          color: 'text-teal-700',
          bg: 'bg-teal-50',
          border: 'border-teal-200',
        };
      }

      return {
        tower,
        wingNumber,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        approvedCount,
        pendingCount,
        ownersCount,
        tenantsCount,
        occupancyRate,
        statusBadge,
      };
    };

    return {
      'Tower A': calculateForTower('Tower A', 1, 60),
      'Tower B': calculateForTower('Tower B', 2, 60),
      'Tower C': calculateForTower('Tower C', 3, 60),
    };
  }, [profiles]);

  // Overall society summary
  const totalSocietyUnits = 180;
  const totalOccupiedUnits =
    towerStats['Tower A'].occupiedUnits +
    towerStats['Tower B'].occupiedUnits +
    towerStats['Tower C'].occupiedUnits;
  const overallOccupancyRate = Math.round((totalOccupiedUnits / totalSocietyUnits) * 100);

  // Selected tower stats
  const activeStats = towerStats[selectedTower];

  // Predefined flat list for active selected tower (Floors 1 to 15, 4 units per floor: 101 to 1504)
  const towerPrefix = selectedTower === 'Tower A' ? 'A' : selectedTower === 'Tower B' ? 'B' : 'C';
  const unitList = useMemo(() => {
    const list: Array<{
      flatNo: string;
      floor: number;
      unitIndex: number;
      isOccupied: boolean;
      isApproved: boolean;
      residentName?: string;
      ownershipType?: string;
    }> = [];

    for (let floor = 1; floor <= 15; floor++) {
      for (let u = 1; u <= 4; u++) {
        const flatNo = `${towerPrefix}-${floor * 100 + u}`;
        const profile = profiles.find(
          (p) => p.flatNo.toUpperCase() === flatNo && p.status !== 'Rejected'
        );
        list.push({
          flatNo,
          floor,
          unitIndex: u,
          isOccupied: Boolean(profile),
          isApproved: Boolean(profile?.isApproved),
          residentName: profile?.name,
          ownershipType: profile?.ownershipType,
        });
      }
    }
    return list;
  }, [towerPrefix, profiles]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:border-slate-300 transition-colors">
      {/* Header Bar */}
      <div className="p-5 sm:p-7 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold border border-teal-500/30">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>Interactive Vector Campus Plan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Solitaire CHS Master Site Map & Tower Occupancy
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Architectural layout of Towers A, B, and C with live occupancy status derived in real-time from the verified resident database.
          </p>
        </div>

        {/* View Switcher & Global Occupancy Metric */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 bg-slate-800/90 rounded-xl border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
              Total Campus Occupancy
            </span>
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="text-lg font-black text-teal-300 font-mono">
                {overallOccupancyRate}%
              </span>
              <span className="text-xs text-slate-300 font-medium">
                ({totalOccupiedUnits} / {totalSocietyUnits} Flats)
              </span>
            </div>
          </div>

          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('campus')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'campus'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Site Plan View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('units')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'units'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unit Floor Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Column: Interactive Vector SVG Site Map (7 Cols) */}
        <div className="lg:col-span-8 p-4 sm:p-6 bg-slate-50/70 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
          <div className="relative w-full aspect-16/10 rounded-2xl overflow-hidden border border-slate-200/90 bg-[#F4F7F6] shadow-inner select-none">
            {/* SVG Architectural Canvas */}
            <svg
              viewBox="0 0 960 560"
              className="w-full h-full"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.02))' }}
            >
              <defs>
                {/* Patterns & Gradients */}
                <pattern id="campusGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.75" strokeDasharray="3 3" />
                </pattern>

                <linearGradient id="towerAGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0f766e" />
                  <stop offset="100%" stopColor="#115e59" />
                </linearGradient>

                <linearGradient id="towerBGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4338ca" />
                  <stop offset="100%" stopColor="#3730a3" />
                </linearGradient>

                <linearGradient id="towerCGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#065f46" />
                </linearGradient>

                <linearGradient id="poolGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>

                <linearGradient id="clubhouseGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>

                <linearGradient id="lawnGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#dcfce7" />
                  <stop offset="100%" stopColor="#bbf7d0" />
                </linearGradient>

                <filter id="buildingGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0f766e" floodOpacity="0.35" />
                </filter>
                <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.08" />
                </filter>
              </defs>

              {/* Grid Background */}
              <rect width="960" height="560" fill="#f8fafc" />
              <rect width="960" height="560" fill="url(#campusGrid)" />

              {/* Society Boundary Wall / Perimeter Fence */}
              <rect
                x="30"
                y="20"
                width="900"
                height="510"
                rx="24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <text x="50" y="42" fill="#64748b" fontSize="10" fontWeight="bold" letterSpacing="1">
                KOOL HOMES SOLITAIRE CHS · LICENSED SITE BOUNDARY
              </text>

              {/* Paved Vehicular Driveway Corridors */}
              {/* Loop around central podium */}
              <path
                d="M 230 530 L 230 450 Q 230 420 200 420 L 110 420 Q 80 420 80 390 L 80 180 Q 80 140 120 140 L 300 140 Q 340 140 340 110 L 340 50 Q 340 20 380 20 L 580 20 Q 620 20 620 50 L 620 110 Q 620 140 660 140 L 840 140 Q 880 140 880 180 L 880 390 Q 880 420 850 420 L 760 420 Q 730 420 730 450 L 730 530"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="48"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 230 530 L 230 450 Q 230 420 200 420 L 110 420 Q 80 420 80 390 L 80 180 Q 80 140 120 140 L 300 140 Q 340 140 340 110 L 340 50 Q 340 20 380 20 L 580 20 Q 620 20 620 50 L 620 110 Q 620 140 660 140 L 840 140 Q 880 140 880 180 L 880 390 Q 880 420 850 420 L 760 420 Q 730 420 730 450 L 730 530"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="40"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 230 530 L 230 450 Q 230 420 200 420 L 110 420 Q 80 420 80 390 L 80 180 Q 80 140 120 140 L 300 140 Q 340 140 340 110 L 340 50 Q 340 20 380 20 L 580 20 Q 620 20 620 50 L 620 110 Q 620 140 660 140 L 840 140 Q 880 140 880 180 L 880 390 Q 880 420 850 420 L 760 420 Q 730 420 730 450 L 730 530"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="8 8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Central Green Podium Garden & Lawn */}
              <rect
                x="330"
                y="240"
                width="300"
                height="240"
                rx="20"
                fill="url(#lawnGrad)"
                stroke="#86efac"
                strokeWidth="2"
              />

              {/* Central Walking Trail */}
              <path
                d="M 360 300 Q 480 270 600 300 Q 610 380 500 420 Q 370 420 360 300 Z"
                fill="none"
                stroke="#bbf7d0"
                strokeWidth="16"
              />
              <path
                d="M 360 300 Q 480 270 600 300 Q 610 380 500 420 Q 370 420 360 300 Z"
                fill="none"
                stroke="#86efac"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {/* Central Amenities: Clubhouse */}
              <g
                className="cursor-pointer transition-transform hover:scale-[1.02]"
                onMouseEnter={() => setHoveredZone('Clubhouse & Banquet Hall')}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => setActiveTab('amenities')}
              >
                <rect
                  x="360"
                  y="260"
                  width="240"
                  height="100"
                  rx="14"
                  fill="#0f172a"
                  filter="url(#subtleShadow)"
                />
                <rect x="365" y="265" width="230" height="90" rx="10" fill="#1e293b" />
                {/* Clubhouse Skylight / Glass Roof */}
                <rect x="420" y="280" width="120" height="40" rx="6" fill="#38bdf8" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1" />
                <text x="480" y="305" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">
                  COMMUNITY CLUBHOUSE
                </text>
                <text x="480" y="325" fill="#94a3b8" fontSize="10" textAnchor="middle">
                  Banquet Hall · Indoor Games
                </text>
              </g>

              {/* Central Amenities: Semi-Olympic Pool */}
              <g
                className="cursor-pointer transition-transform hover:scale-[1.02]"
                onMouseEnter={() => setHoveredZone('Swimming Pool (Chlorinated 1.5 ppm)')}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => setActiveTab('amenities')}
              >
                {/* Pool Deck */}
                <rect x="360" y="380" width="150" height="85" rx="12" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="1.5" />
                {/* Pool Water Basin */}
                <rect x="370" y="390" width="130" height="65" rx="8" fill="url(#poolGrad)" filter="url(#subtleShadow)" />
                {/* Lane Dividers */}
                <line x1="370" y1="412" x2="500" y2="412" stroke="#ffffff" strokeWidth="1" strokeDasharray="6 4" strokeOpacity="0.7" />
                <line x1="370" y1="432" x2="500" y2="432" stroke="#ffffff" strokeWidth="1" strokeDasharray="6 4" strokeOpacity="0.7" />
                <text x="435" y="426" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                  SWIMMING POOL
                </text>
              </g>

              {/* Children Play Area */}
              <g
                className="cursor-pointer transition-transform hover:scale-[1.02]"
                onMouseEnter={() => setHoveredZone('Kids Play Area & Sandbox')}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => setActiveTab('amenities')}
              >
                <rect x="525" y="380" width="90" height="85" rx="12" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1.5" />
                <circle cx="570" cy="415" r="18" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="570" y="418" fill="#92400e" fontSize="9" fontWeight="bold" textAnchor="middle">
                  PLAY PARK
                </text>
                <text x="570" y="445" fill="#b45309" fontSize="8" textAnchor="middle">
                  Turf & Swings
                </text>
              </g>

              {/* ======================================================== */}
              {/* TOWER A (WING 1) - INTERACTIVE BUILDING VECTOR */}
              {/* ======================================================== */}
              <g
                className="cursor-pointer transition-all duration-300"
                onClick={() => setSelectedTower('Tower A')}
                onMouseEnter={() => setHoveredTower('Tower A')}
                onMouseLeave={() => setHoveredTower(null)}
              >
                {/* Ground Shadow */}
                <rect
                  x="90"
                  y="170"
                  width="180"
                  height="220"
                  rx="18"
                  fill="#000000"
                  fillOpacity="0.08"
                  transform="translate(8, 12)"
                />

                {/* Building Base / Body */}
                <rect
                  x="90"
                  y="170"
                  width="180"
                  height="220"
                  rx="18"
                  fill={selectedTower === 'Tower A' ? 'url(#towerAGrad)' : hoveredTower === 'Tower A' ? '#134e4a' : '#1e293b'}
                  stroke={selectedTower === 'Tower A' ? '#2dd4bf' : hoveredTower === 'Tower A' ? '#14b8a6' : '#334155'}
                  strokeWidth={selectedTower === 'Tower A' ? '3.5' : '1.5'}
                  filter={selectedTower === 'Tower A' ? 'url(#buildingGlow)' : 'url(#subtleShadow)'}
                />

                {/* Floor Rows Pattern (15 Floors indicator lines) */}
                {Array.from({ length: 9 }).map((_, i) => (
                  <line
                    key={i}
                    x1="105"
                    y1={195 + i * 16}
                    x2="255"
                    y2={195 + i * 16}
                    stroke="#ffffff"
                    strokeWidth="0.8"
                    strokeOpacity={selectedTower === 'Tower A' ? 0.25 : 0.12}
                  />
                ))}

                {/* Elevator Core / Utility Shaft */}
                <rect x="155" y="185" width="50" height="70" rx="4" fill="#0f172a" fillOpacity="0.4" />
                <text x="180" y="200" fill="#2dd4bf" fontSize="7" fontWeight="bold" textAnchor="middle">
                  OTIS CORE
                </text>

                {/* Tower Title & Wing */}
                <text x="180" y="275" fill="#ffffff" fontSize="16" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">
                  TOWER A
                </text>
                <text x="180" y="295" fill="#99f6e4" fontSize="11" fontWeight="semibold" textAnchor="middle">
                  Wing 1 · 15 Floors (60 Flats)
                </text>

                {/* Live Occupancy Badge on Building */}
                <rect
                  x="115"
                  y="315"
                  width="130"
                  height="26"
                  rx="8"
                  fill={selectedTower === 'Tower A' ? '#ffffff' : '#0f766e'}
                  fillOpacity={selectedTower === 'Tower A' ? '0.95' : '0.8'}
                />
                <circle
                  cx="132"
                  cy="328"
                  r="4"
                  fill={towerStats['Tower A'].occupancyRate >= 80 ? '#10b981' : '#f59e0b'}
                />
                <text
                  x="184"
                  y="332"
                  fill={selectedTower === 'Tower A' ? '#0f172a' : '#ffffff'}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {towerStats['Tower A'].occupancyRate}% OCCUPIED
                </text>

                <text x="180" y="365" fill="#cbd5e1" fontSize="9" textAnchor="middle">
                  FastTag Bays: P-A-101 to 130
                </text>
              </g>

              {/* ======================================================== */}
              {/* TOWER B (WING 2) - INTERACTIVE BUILDING VECTOR */}
              {/* ======================================================== */}
              <g
                className="cursor-pointer transition-all duration-300"
                onClick={() => setSelectedTower('Tower B')}
                onMouseEnter={() => setHoveredTower('Tower B')}
                onMouseLeave={() => setHoveredTower(null)}
              >
                {/* Ground Shadow */}
                <rect
                  x="690"
                  y="170"
                  width="180"
                  height="220"
                  rx="18"
                  fill="#000000"
                  fillOpacity="0.08"
                  transform="translate(8, 12)"
                />

                {/* Building Base / Body */}
                <rect
                  x="690"
                  y="170"
                  width="180"
                  height="220"
                  rx="18"
                  fill={selectedTower === 'Tower B' ? 'url(#towerBGrad)' : hoveredTower === 'Tower B' ? '#312e81' : '#1e293b'}
                  stroke={selectedTower === 'Tower B' ? '#818cf8' : hoveredTower === 'Tower B' ? '#6366f1' : '#334155'}
                  strokeWidth={selectedTower === 'Tower B' ? '3.5' : '1.5'}
                  filter={selectedTower === 'Tower B' ? 'url(#buildingGlow)' : 'url(#subtleShadow)'}
                />

                {/* Balconies & Windows Grid */}
                {Array.from({ length: 9 }).map((_, i) => (
                  <line
                    key={i}
                    x1="705"
                    y1={195 + i * 16}
                    x2="855"
                    y2={195 + i * 16}
                    stroke="#ffffff"
                    strokeWidth="0.8"
                    strokeOpacity={selectedTower === 'Tower B' ? 0.25 : 0.12}
                  />
                ))}

                {/* Service Stretcher Lift Indicator */}
                <rect x="755" y="185" width="50" height="70" rx="4" fill="#0f172a" fillOpacity="0.4" />
                <text x="780" y="200" fill="#a5b4fc" fontSize="7" fontWeight="bold" textAnchor="middle">
                  SERVICE LIFT
                </text>

                {/* Tower Title & Wing */}
                <text x="780" y="275" fill="#ffffff" fontSize="16" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">
                  TOWER B
                </text>
                <text x="780" y="295" fill="#c7d2fe" fontSize="11" fontWeight="semibold" textAnchor="middle">
                  Wing 2 · 15 Floors (60 Flats)
                </text>

                {/* Live Occupancy Badge on Building */}
                <rect
                  x="715"
                  y="315"
                  width="130"
                  height="26"
                  rx="8"
                  fill={selectedTower === 'Tower B' ? '#ffffff' : '#4338ca'}
                  fillOpacity={selectedTower === 'Tower B' ? '0.95' : '0.8'}
                />
                <circle
                  cx="732"
                  cy="328"
                  r="4"
                  fill={towerStats['Tower B'].occupancyRate >= 80 ? '#10b981' : '#f59e0b'}
                />
                <text
                  x="784"
                  y="332"
                  fill={selectedTower === 'Tower B' ? '#0f172a' : '#ffffff'}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {towerStats['Tower B'].occupancyRate}% OCCUPIED
                </text>

                <text x="780" y="365" fill="#cbd5e1" fontSize="9" textAnchor="middle">
                  FastTag Bays: P-B-101 to 130
                </text>
              </g>

              {/* ======================================================== */}
              {/* TOWER C (WING 3) - INTERACTIVE BUILDING VECTOR */}
              {/* ======================================================== */}
              <g
                className="cursor-pointer transition-all duration-300"
                onClick={() => setSelectedTower('Tower C')}
                onMouseEnter={() => setHoveredTower('Tower C')}
                onMouseLeave={() => setHoveredTower(null)}
              >
                {/* Ground Shadow */}
                <rect
                  x="390"
                  y="35"
                  width="180"
                  height="185"
                  rx="18"
                  fill="#000000"
                  fillOpacity="0.08"
                  transform="translate(8, 12)"
                />

                {/* Building Base / Body */}
                <rect
                  x="390"
                  y="35"
                  width="180"
                  height="185"
                  rx="18"
                  fill={selectedTower === 'Tower C' ? 'url(#towerCGrad)' : hoveredTower === 'Tower C' ? '#064e3b' : '#1e293b'}
                  stroke={selectedTower === 'Tower C' ? '#34d399' : hoveredTower === 'Tower C' ? '#10b981' : '#334155'}
                  strokeWidth={selectedTower === 'Tower C' ? '3.5' : '1.5'}
                  filter={selectedTower === 'Tower C' ? 'url(#buildingGlow)' : 'url(#subtleShadow)'}
                />

                {/* Modern Glazing facade lines */}
                {Array.from({ length: 7 }).map((_, i) => (
                  <line
                    key={i}
                    x1="405"
                    y1={55 + i * 16}
                    x2="555"
                    y2={55 + i * 16}
                    stroke="#ffffff"
                    strokeWidth="0.8"
                    strokeOpacity={selectedTower === 'Tower C' ? 0.25 : 0.12}
                  />
                ))}

                {/* Tower Title & Wing */}
                <text x="480" y="110" fill="#ffffff" fontSize="16" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">
                  TOWER C
                </text>
                <text x="480" y="128" fill="#a7f3d0" fontSize="11" fontWeight="semibold" textAnchor="middle">
                  Wing 3 · 15 Floors (60 Flats)
                </text>

                {/* Live Occupancy Badge on Building */}
                <rect
                  x="415"
                  y="145"
                  width="130"
                  height="26"
                  rx="8"
                  fill={selectedTower === 'Tower C' ? '#ffffff' : '#059669'}
                  fillOpacity={selectedTower === 'Tower C' ? '0.95' : '0.8'}
                />
                <circle
                  cx="432"
                  cy="158"
                  r="4"
                  fill={towerStats['Tower C'].occupancyRate >= 50 ? '#10b981' : '#f59e0b'}
                />
                <text
                  x="484"
                  y="162"
                  fill={selectedTower === 'Tower C' ? '#0f172a' : '#ffffff'}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {towerStats['Tower C'].occupancyRate}% OCCUPIED
                </text>

                <text x="480" y="195" fill="#cbd5e1" fontSize="9" textAnchor="middle">
                  EV Charging Station Bays
                </text>
              </g>

              {/* Security Gate A & Gate B */}
              {/* Gate A */}
              <g
                className="cursor-pointer"
                onMouseEnter={() => setHoveredZone('Security Gate A (Vehicular & FastTag Boom Barrier)')}
                onMouseLeave={() => setHoveredZone(null)}
              >
                <rect x="200" y="490" width="60" height="35" rx="6" fill="#0f172a" />
                <rect x="205" y="495" width="50" height="25" rx="4" fill="#334155" />
                <text x="230" y="511" fill="#f8fafc" fontSize="8" fontWeight="bold" textAnchor="middle">
                  GATE A
                </text>
                {/* Boom Barrier */}
                <line x1="260" y1="507" x2="295" y2="507" stroke="#ef4444" strokeWidth="3" strokeDasharray="5 3" />
              </g>

              {/* Gate B */}
              <g
                className="cursor-pointer"
                onMouseEnter={() => setHoveredZone('Security Gate B (Pedestrian / Delivery Station)')}
                onMouseLeave={() => setHoveredZone(null)}
              >
                <rect x="700" y="490" width="60" height="35" rx="6" fill="#0f172a" />
                <rect x="705" y="495" width="50" height="25" rx="4" fill="#334155" />
                <text x="730" y="511" fill="#f8fafc" fontSize="8" fontWeight="bold" textAnchor="middle">
                  GATE B
                </text>
                <line x1="665" y1="507" x2="700" y2="507" stroke="#3b82f6" strokeWidth="2.5" />
              </g>

              {/* Infrastructure Points: STP Plant */}
              <g
                className="cursor-pointer"
                onMouseEnter={() => setHoveredZone('MBBR STP Plant & Tertiary Recycled Tanks (48k L/day)')}
                onMouseLeave={() => setHoveredZone(null)}
              >
                <rect x="60" y="50" width="85" height="50" rx="8" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" />
                <text x="102" y="72" fill="#0369a1" fontSize="9" fontWeight="bold" textAnchor="middle">
                  STP PLANT
                </text>
                <text x="102" y="87" fill="#0284c7" fontSize="7" textAnchor="middle">
                  Recycled Flush Line
                </text>
              </g>

              {/* DG Backup Yard */}
              <g
                className="cursor-pointer"
                onMouseEnter={() => setHoveredZone('Twin 350 kVA Cummins Diesel Generator Yard')}
                onMouseLeave={() => setHoveredZone(null)}
              >
                <rect x="815" y="50" width="85" height="50" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
                <text x="857" y="72" fill="#b45309" fontSize="9" fontWeight="bold" textAnchor="middle">
                  DG BACKUP
                </text>
                <text x="857" y="87" fill="#92400e" fontSize="7" textAnchor="middle">
                  Cummins 700 kVA
                </text>
              </g>

              {/* Compass Rose */}
              <g transform="translate(900, 75)">
                <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                <polygon points="0,-14 5,2 0,-1" fill="#ef4444" />
                <polygon points="0,14 5,-2 0,1" fill="#64748b" />
                <polygon points="0,-14 -5,2 0,-1" fill="#dc2626" />
                <polygon points="0,14 -5,-2 0,1" fill="#94a3b8" />
                <text x="0" y="-18" fill="#0f172a" fontSize="9" fontWeight="bold" textAnchor="middle">
                  N
                </text>
              </g>
            </svg>

            {/* Hover Tooltip / Status Floating Bar */}
            {hoveredZone && (
              <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 px-3 py-1.5 bg-slate-900/90 text-white text-xs font-semibold rounded-xl backdrop-blur-xs shadow-lg border border-slate-700 pointer-events-none flex items-center gap-2 animate-in fade-in duration-100">
                <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="truncate">{hoveredZone}</span>
              </div>
            )}
          </div>

          {/* Interactive Legend & Quick Switchers */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Select Tower:
              </span>
              {(['Tower A', 'Tower B', 'Tower C'] as TowerId[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTower(t)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
                    selectedTower === t
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t}
                  <span className="ml-1.5 font-mono text-[10px] text-teal-600">
                    {towerStats[t].occupancyRate}%
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Verified Occupied</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Pending</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span>Vacant</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Data Inspector & Floor Breakdown (4 Cols) */}
        <div className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between space-y-5 bg-white">
          {/* Tower Details Header */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                  Wing {activeStats.wingNumber} Active Inspector
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {activeStats.tower}
                </h3>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${activeStats.statusBadge.bg} ${activeStats.statusBadge.color} ${activeStats.statusBadge.border}`}
              >
                {activeStats.statusBadge.label}
              </span>
            </div>

            {/* Occupancy Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600">Occupancy Level</span>
                <span className="text-slate-900 font-mono font-bold">
                  {activeStats.occupiedUnits} / {activeStats.totalUnits} Units ({activeStats.occupancyRate}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    activeStats.occupancyRate >= 80
                      ? 'bg-emerald-500'
                      : activeStats.occupancyRate >= 50
                      ? 'bg-teal-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${activeStats.occupancyRate}%` }}
                />
              </div>
            </div>

            {/* Detailed Metric Cards */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Verified Occupants
                </span>
                <span className="text-lg font-black font-mono text-emerald-800">
                  {activeStats.approvedCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">MC Approved</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Awaiting MC Approval
                </span>
                <span className="text-lg font-black font-mono text-amber-800">
                  {activeStats.pendingCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Document Check</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Owner Residents
                </span>
                <span className="text-base font-black font-mono text-slate-800">
                  {activeStats.ownersCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Primary Titles</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Registered Tenants
                </span>
                <span className="text-base font-black font-mono text-slate-800">
                  {activeStats.tenantsCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Police Verified</span>
              </div>
            </div>

            {/* View Mode 2: Unit Floor Matrix */}
            {viewMode === 'units' && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                  <span className="font-bold text-slate-800">Floor-by-Floor Unit Matrix</span>
                  <span className="text-[10px] text-slate-400 font-mono">15 Floors · 4 Flats</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {Array.from({ length: 15 }, (_, f) => 15 - f).map((floor) => {
                    const floorUnits = unitList.filter((u) => u.floor === floor);
                    return (
                      <div
                        key={floor}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/60"
                      >
                        <span className="font-mono text-[11px] font-bold text-slate-600 w-12">
                          Fl {floor}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {floorUnits.map((u) => (
                            <span
                              key={u.flatNo}
                              title={`${u.flatNo}: ${
                                u.isOccupied
                                  ? `${u.residentName} (${u.ownershipType || 'Member'}) - ${
                                      u.isApproved ? 'Verified' : 'Pending'
                                    }`
                                  : 'Vacant / Unregistered'
                              }`}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-default ${
                                !u.isOccupied
                                  ? 'bg-slate-200 text-slate-500'
                                  : u.isApproved
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {u.flatNo.split('-')[1]}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Society Specifications */}
            <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl text-xs space-y-1 text-teal-950">
              <span className="font-bold block">Wing Specifications:</span>
              <p className="text-[11px] text-teal-900 leading-relaxed">
                {selectedTower === 'Tower A' &&
                  '15 Floors · 2 Otis passenger elevators · 2 & 3 BHK configurations · FastTag parking bays P-A-101 to P-A-130.'}
                {selectedTower === 'Tower B' &&
                  '15 Floors · Dedicated medical service stretcher elevator · Garden facing balconies · FastTag bays P-B-101 to P-B-130.'}
                {selectedTower === 'Tower C' &&
                  '15 Floors · Modern high-speed elevators · EV charging station infrastructure · Fire refuge shaft integration.'}
              </p>
            </div>
          </div>

          {/* Action Link to Resident Registry */}
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('registry')}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
            >
              <span>Explore {activeStats.tower} in Member Registry</span>
              <ArrowRight className="w-4 h-4 text-teal-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
