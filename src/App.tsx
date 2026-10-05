/**
 * SISTEM HR STAFF & KARYAWAN — PT BATU KARANG
 * Divisi Produksi I (PP1)
 * Developed by Lalu Mahendra
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AuthUser,
  StaffData,
  PresensiRecord,
  LemburRecord,
  CutiRecord,
  MutasiRecord,
  CalonKaryawan,
  LinkArsip,
  KpiRecord,
  GasConfig,
  UserRole,
} from './types';
import { storageService } from './services/storageService';
import { RoleSimulatorBar } from './components/RoleSimulatorBar';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { LoginGateModal } from './components/LoginGateModal';
import { HelpModal } from './components/modals/HelpModal';
import { SwitchBoardModal } from './components/modals/SwitchBoardModal';
import { GasCenterModal } from './components/modals/GasCenterModal';

// Tabs
import { DashboardTab } from './components/tabs/DashboardTab';
import { PresensiTab } from './components/tabs/PresensiTab';
import { LemburTab } from './components/tabs/LemburTab';
import { RekapPresensiTab } from './components/tabs/RekapPresensiTab';
import { SlipGajiTab } from './components/tabs/SlipGajiTab';
import { CutiIjinTab } from './components/tabs/CutiIjinTab';
import { KpiScoringTab } from './components/tabs/KpiScoringTab';
import { DatabaseStaffTab } from './components/tabs/DatabaseStaffTab';
import { JadwalMutasiTab } from './components/tabs/JadwalMutasiTab';
import { PelatihanCalonTab } from './components/tabs/PelatihanCalonTab';
import { ProfilStaffTab } from './components/tabs/ProfilStaffTab';
import { HakAksesTab } from './components/tabs/HakAksesTab';

export default function App() {
  // Master State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => storageService.getAuthUser());
  const [staffList, setStaffList] = useState<StaffData[]>(() => storageService.getStaffList());
  const [presensiList, setPresensiList] = useState<PresensiRecord[]>(() => storageService.getPresensiList());
  const [lemburList, setLemburList] = useState<LemburRecord[]>(() => storageService.getLemburList());
  const [cutiList, setCutiList] = useState<CutiRecord[]>(() => storageService.getCutiList());
  const [mutasiList, setMutasiList] = useState<MutasiRecord[]>(() => storageService.getMutasiList());
  const [calonList, setCalonList] = useState<CalonKaryawan[]>(() => storageService.getCalonList());
  const [linksList, setLinksList] = useState<LinkArsip[]>(() => storageService.getLinksList());
  const [kpiList, setKpiList] = useState<KpiRecord[]>(() => storageService.getKpiList());
  const [gasConfig, setGasConfig] = useState<GasConfig>(() => storageService.getGasConfig());
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => storageService.getThemeMode());
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => storageService.getSidebarCollapsed());

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>(() => {
    const user = storageService.getAuthUser();
    if (user?.portalType === 'staff') return 'slip';
    return 'dashboard';
  });

  const [selectedDept, setSelectedDept] = useState<'Semua' | 'Operasional' | 'Administrasi'>('Semua');
  const [viewingProfileNip, setViewingProfileNip] = useState<string | undefined>(undefined);

  // Modals & Panels
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSwitchBoardOpen, setIsSwitchBoardOpen] = useState(false);
  const [isGasCenterOpen, setIsGasCenterOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Secret Door & Developer Supervisor
  const [secretDoorTriggered, setSecretDoorTriggered] = useState(false);
  const [isDevSupervisorVisible, setIsDevSupervisorVisible] = useState(() => {
    const role = currentUser?.role;
    return role === 'Lead Developer' || role === 'Project Manager';
  });

  // Apply Theme Mode class on HTML
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode]);

  // Handle Automatic Due Mutation Application
  const handleApplyDueMutations = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    let appliedCount = 0;
    const updatedMutasi = [...mutasiList];
    const updatedStaff = [...staffList];

    updatedMutasi.forEach((m, idx) => {
      if (m.status === 'Terjadwal' && m.tanggalEfektif <= todayStr) {
        updatedMutasi[idx].status = 'Diterapkan';
        appliedCount++;

        // Apply to staff
        const sIdx = updatedStaff.findIndex((s) => s.nip === m.nip);
        if (sIdx !== -1) {
          if (m.jenisMutasi === 'Jabatan') updatedStaff[sIdx].jabatan = m.nilaiBaru;
          else if (m.jenisMutasi === 'Level/Kategori') updatedStaff[sIdx].level = m.nilaiBaru;
          else if (m.jenisMutasi === 'Sekup') updatedStaff[sIdx].sekup = m.nilaiBaru as any;
          else if (m.jenisMutasi === 'Status Kepegawaian') updatedStaff[sIdx].status = m.nilaiBaru as any;
          else if (m.jenisMutasi === 'Status Aktif') updatedStaff[sIdx].statusAktif = m.nilaiBaru as any;
          else if (m.jenisMutasi === 'Gaji Pokok') {
            updatedStaff[sIdx].gajiPokok = Number(m.nilaiBaru) || 0;
            updatedStaff[sIdx].totalGaji = updatedStaff[sIdx].gajiPokok + updatedStaff[sIdx].tunjanganJabatan;
          } else if (m.jenisMutasi === 'Tunjangan Jabatan') {
            updatedStaff[sIdx].tunjanganJabatan = Number(m.nilaiBaru) || 0;
            updatedStaff[sIdx].totalGaji = updatedStaff[sIdx].gajiPokok + updatedStaff[sIdx].tunjanganJabatan;
          }
        }
      }
    });

    if (appliedCount > 0) {
      storageService.saveMutasiList(updatedMutasi);
      storageService.saveStaffList(updatedStaff);
      setMutasiList(updatedMutasi);
      setStaffList(updatedStaff);
      alert(`${appliedCount} mutasi terjadwal yang sudah jatuh tempo berhasil diterapkan ke database.`);
    } else {
      alert('Tidak ada mutasi terjadwal yang jatuh tempo hari ini.');
    }
  };

  // Toggle Theme
  const handleToggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    storageService.saveThemeMode(next);
  };

  // Toggle Sidebar
  const handleToggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    storageService.saveSidebarCollapsed(next);
  };

  // Login Handler
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    storageService.saveAuthUser(user);
    setIsLoginModalOpen(false);
    if (user.role === 'Lead Developer' || user.role === 'Project Manager') {
      setIsDevSupervisorVisible(true);
    }
    if (user.portalType === 'staff') {
      setActiveTab('slip');
    } else {
      setActiveTab('dashboard');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setCurrentUser(null);
    storageService.saveAuthUser(null);
    setIsLoginModalOpen(true);
  };

  // Role Simulator Switch
  const handleSwitchRole = (role: UserRole) => {
    if (!currentUser) return;
    let allowed = [
      'dashboard',
      'presensi',
      'lembur',
      'rekap',
      'slip',
      'cuti',
      'kpi',
      'database',
      'mutasi',
      'pelatihan',
      'profil',
      'hakakses',
    ];
    let portalType: 'management' | 'staff' = 'management';
    let nip = currentUser.nip;
    let nama = currentUser.nama;

    if (role === 'Lead Developer') {
      nama = 'Lead Developer (Debug Mode)';
      nip = 'BK-PP1-DEV-00';
    } else if (role === 'Project Manager') {
      nama = 'Lalu Mahendra Ali Akbar';
      nip = 'BK-PP1-001';
    } else if (role === 'Site Engineer') {
      nama = 'Andhik Dharmabakti';
      nip = 'BK-PP1-002';
      allowed = ['dashboard', 'presensi', 'lembur', 'kpi', 'database', 'profil'];
    } else if (role === 'Admin HR') {
      nama = 'Fitri Handayani';
      nip = 'BK-PP1-008';
    } else if (role === 'Finance') {
      nama = 'Hendra Wijaya';
      nip = 'BK-PP1-010';
      allowed = ['dashboard', 'slip', 'rekap', 'database', 'profil'];
    } else if (role === 'Kepala Dept') {
      nama = 'Bambang Sudarsono';
      nip = 'BK-PP1-003';
      allowed = ['dashboard', 'presensi', 'lembur', 'cuti', 'kpi', 'profil'];
    } else if (role === 'Staf') {
      nama = 'Fajar Nugroho';
      nip = 'BK-PP1-006';
      portalType = 'staff';
      allowed = ['slip', 'presensi', 'cuti', 'profil'];
    }

    const updated: AuthUser = {
      ...currentUser,
      role,
      nama,
      nip,
      portalType,
      allowedTabs: allowed,
    };

    setCurrentUser(updated);
    storageService.saveAuthUser(updated);

    if (portalType === 'staff' && !allowed.includes(activeTab)) {
      setActiveTab('slip');
    }
  };

  // Handlers for Staff CRUD
  const handleAddStaff = (st: StaffData) => {
    storageService.addStaff(st);
    setStaffList(storageService.getStaffList());
  };

  const handleUpdateStaff = (nip: string, patch: Partial<StaffData>) => {
    storageService.updateStaff(nip, patch);
    setStaffList(storageService.getStaffList());
  };

  const handleDeleteStaff = (nip: string) => {
    const success = storageService.deleteStaff(nip, currentUser?.nama || 'Admin');
    if (success) {
      setStaffList(storageService.getStaffList());
    }
  };

  // Handlers for Presensi
  const handleAddPresensi = (rec: PresensiRecord) => {
    storageService.addPresensi(rec);
    setPresensiList(storageService.getPresensiList());
  };

  const handleAddPresensiBatch = (records: PresensiRecord[]) => {
    storageService.addPresensiBatch(records);
    setPresensiList(storageService.getPresensiList());
  };

  const handleDeletePresensi = (id: string) => {
    storageService.deletePresensi(id, currentUser?.nama || 'Admin');
    setPresensiList(storageService.getPresensiList());
  };

  // Handlers for Lembur
  const handleAddLemburBatch = (records: LemburRecord[]) => {
    storageService.addLemburBatch(records);
    setLemburList(storageService.getLemburList());
  };

  // Handlers for Cuti
  const handleAddCuti = (rec: CutiRecord) => {
    storageService.addCuti(rec);
    setCutiList(storageService.getCutiList());
  };

  const handleUpdateCutiStatus = (id: string, status: 'Disetujui' | 'Ditolak', approver: string) => {
    storageService.updateCutiStatus(id, status, approver);
    setCutiList(storageService.getCutiList());
  };

  // Handlers for Mutasi
  const handleAddMutasi = (rec: MutasiRecord) => {
    storageService.addMutasi(rec);
    setMutasiList(storageService.getMutasiList());
  };

  const handleUpdateMutasiStatus = (id: string, status: 'Diterapkan' | 'Dibatalkan') => {
    storageService.updateMutasiStatus(id, status);
    setMutasiList(storageService.getMutasiList());
  };

  // Handlers for Calon
  const handleAddCalon = (c: CalonKaryawan) => {
    storageService.addCalon(c);
    setCalonList(storageService.getCalonList());
  };

  const handleGraduateCalon = (calonId: string, newStaff: StaffData) => {
    // Add to staff
    storageService.addStaff(newStaff);
    // Remove from active calon list
    const updated = calonList.filter((c) => c.id !== calonId);
    storageService.saveCalonList(updated);
    setCalonList(updated);
    setStaffList(storageService.getStaffList());
    alert(`${newStaff.nama} berhasil dinyatakan LOLOS dan masuk ke Database Karyawan (NIP: ${newStaff.nip}).`);
  };

  const handleExtendCalon = (calonId: string, newEndDate: string, reason: string) => {
    const updated = calonList.map((c) => {
      if (c.id === calonId) {
        return {
          ...c,
          tanggalAkhir: newEndDate,
          jumlahPerpanjangan: c.jumlahPerpanjangan + 1,
          catatan: reason,
        };
      }
      return c;
    });
    storageService.saveCalonList(updated);
    setCalonList(updated);
  };

  const handleFailCalon = (calonId: string, reason: string) => {
    const target = calonList.find((c) => c.id === calonId);
    if (target) {
      storageService.addDeletedArchive({
        id: 'arch-' + Date.now(),
        kategori: 'STAFF',
        waktuDihapus: new Date().toISOString(),
        dihapusOleh: currentUser?.nama || 'Admin',
        nama: target.nama,
        detailJson: JSON.stringify({ ...target, alasanTidakLolos: reason }),
      });
    }
    const updated = calonList.filter((c) => c.id !== calonId);
    storageService.saveCalonList(updated);
    setCalonList(updated);
  };

  // Handlers for Links
  const handleAddLink = (link: LinkArsip) => {
    storageService.addLink(link);
    setLinksList(storageService.getLinksList());
  };

  const handleDeleteLink = (id: string) => {
    storageService.deleteLink(id);
    setLinksList(storageService.getLinksList());
  };

  // Handlers for KPI
  const handleSaveKpi = (kpi: KpiRecord) => {
    storageService.addOrUpdateKpi(kpi);
    setKpiList(storageService.getKpiList());
  };

  // Navigate to staff profile
  const handleViewProfile = (nip: string) => {
    setViewingProfileNip(nip);
    setActiveTab('profil');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* Dev Supervisor Floating Bar */}
      <RoleSimulatorBar
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        onClose={() => setIsDevSupervisorVisible(false)}
        isVisible={isDevSupervisorVisible}
      />

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenSwitchBoard={() => setIsSwitchBoardOpen(true)}
        onOpenGasCenter={() => setIsGasCenterOpen(true)}
        selectedDept={selectedDept}
        onChangeDept={setSelectedDept}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
        onTriggerSecretDoor={() => setSecretDoorTriggered(true)}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Sidebar for Desktop / Tablet */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        currentUser={currentUser}
        onOpenSwitchBoard={() => setIsSwitchBoardOpen(true)}
      />

      {/* Main Viewport */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 pt-16 pb-20 lg:pb-10 ${
          isDevSupervisorVisible ? 'mt-8' : ''
        } ${sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-64'}`}
      >
        <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardTab
              staffList={staffList}
              presensiList={presensiList}
              lemburList={lemburList}
              onNavigateTab={setActiveTab}
              selectedDept={selectedDept}
            />
          )}

          {activeTab === 'presensi' && (
            <PresensiTab
              presensiList={presensiList}
              staffList={staffList}
              onAddPresensi={handleAddPresensi}
              onAddPresensiBatch={handleAddPresensiBatch}
              onDeletePresensi={handleDeletePresensi}
              currentUserNip={currentUser?.nip}
              isStaffPortal={currentUser?.portalType === 'staff'}
            />
          )}

          {activeTab === 'lembur' && (
            <LemburTab
              lemburList={lemburList}
              staffList={staffList}
              onAddLemburBatch={handleAddLemburBatch}
              currentUserNip={currentUser?.nip}
              isStaffPortal={currentUser?.portalType === 'staff'}
            />
          )}

          {activeTab === 'rekap' && (
            <RekapPresensiTab
              presensiList={presensiList}
              staffList={staffList}
              currentUserNip={currentUser?.nip}
              isStaffPortal={currentUser?.portalType === 'staff'}
            />
          )}

          {activeTab === 'slip' && (
            <SlipGajiTab
              staffList={staffList}
              presensiList={presensiList}
              lemburList={lemburList}
              currentUserNip={currentUser?.nip}
              isStaffPortal={currentUser?.portalType === 'staff'}
            />
          )}

          {activeTab === 'cuti' && (
            <CutiIjinTab
              cutiList={cutiList}
              staffList={staffList}
              onAddCuti={handleAddCuti}
              onUpdateStatus={handleUpdateCutiStatus}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'kpi' && (
            <KpiScoringTab
              kpiList={kpiList}
              staffList={staffList}
              onSaveKpi={handleSaveKpi}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'database' && (
            <DatabaseStaffTab
              staffList={staffList}
              onAddStaff={handleAddStaff}
              onUpdateStaff={handleUpdateStaff}
              onDeleteStaff={handleDeleteStaff}
              onAddMutasi={handleAddMutasi}
              onViewProfile={handleViewProfile}
            />
          )}

          {activeTab === 'mutasi' && (
            <JadwalMutasiTab
              mutasiList={mutasiList}
              staffList={staffList}
              onUpdateMutasiStatus={handleUpdateMutasiStatus}
              onApplyDueMutations={handleApplyDueMutations}
            />
          )}

          {activeTab === 'pelatihan' && (
            <PelatihanCalonTab
              calonList={calonList}
              onAddCalon={handleAddCalon}
              onGraduateCalon={handleGraduateCalon}
              onExtendCalon={handleExtendCalon}
              onFailCalon={handleFailCalon}
            />
          )}

          {activeTab === 'profil' && (
            <ProfilStaffTab
              staffList={staffList}
              presensiList={presensiList}
              linksList={linksList}
              onAddLink={handleAddLink}
              onDeleteLink={handleDeleteLink}
              selectedStaffNip={viewingProfileNip}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'hakakses' && (
            <HakAksesTab
              currentUser={currentUser}
              deletedArchives={storageService.getDeletedArchives()}
              onResetData={() => storageService.resetAllData()}
            />
          )}
        </main>

        {/* Mandatory Web App Footer */}
        <footer className="mt-auto py-4 px-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 no-print">
          <p className="font-semibold">
            Sistem HR Staff &amp; Karyawan All Rights Reserved . Divisi Produksi I . Developed by Lalu Mahendra
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            PT Batu Karang — Divisi Produksi 1 (PP1) | Standalone Headless GAS V2 Ready
          </p>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onOpenMoreMenu={() => setIsMobileMoreOpen(true)}
      />

      {/* Mobile More Tabs Sheet */}
      {isMobileMoreOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-slate-950/70 backdrop-blur-sm lg:hidden animate-in fade-in duration-200 no-print">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Menu Modul Lainnya
              </span>
              <button
                onClick={() => setIsMobileMoreOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'presensi', label: 'Presensi & Ijin' },
                { id: 'lembur', label: 'Lembur SPKL' },
                { id: 'rekap', label: 'Rekap Presensi' },
                { id: 'slip', label: 'Slip Gaji' },
                { id: 'cuti', label: 'Pengajuan Cuti' },
                { id: 'kpi', label: 'Matriks KPI' },
                { id: 'database', label: 'Database Staff' },
                { id: 'mutasi', label: 'Jadwal Mutasi' },
                { id: 'pelatihan', label: 'Calon Karyawan' },
                { id: 'profil', label: 'Profil Saya' },
                { id: 'hakakses', label: 'Hak Akses RBAC' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveTab(m.id);
                    setIsMobileMoreOpen(false);
                  }}
                  className={`p-3 rounded-xl text-left font-semibold transition-colors ${
                    activeTab === m.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <SwitchBoardModal isOpen={isSwitchBoardOpen} onClose={() => setIsSwitchBoardOpen(false)} />
      <GasCenterModal
        isOpen={isGasCenterOpen}
        onClose={() => setIsGasCenterOpen(false)}
        config={gasConfig}
        onUpdateConfig={setGasConfig}
        onDataSyncSuccess={() => {
          setStaffList(storageService.getStaffList());
          setPresensiList(storageService.getPresensiList());
          setLinksList(storageService.getLinksList());
        }}
      />

      {/* Dual Gate Login Modal */}
      <LoginGateModal
        isOpen={!currentUser || isLoginModalOpen}
        onLoginSuccess={handleLoginSuccess}
        staffList={staffList}
        secretDoorTriggered={secretDoorTriggered}
        onCloseSecretDoorTrigger={() => setSecretDoorTriggered(false)}
        onUnlockDeveloperMode={() => setIsDevSupervisorVisible(true)}
      />
    </div>
  );
}
