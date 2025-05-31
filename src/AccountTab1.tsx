import React, { useEffect, useRef, useState } from 'react';
import { MultiSelectDropdown } from "../../../components/common/MultiSelectDropdown";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../../components/ui/table";
import PaginationWithText from "../../../components/ui/pagination/PaginationWithText";
import Button from "../../../components/ui/button/Button";
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { Modal } from '../../../components/ui/modal';
import InputField from '../../../components/form/input/InputField';
import TextArea from '../../../components/form/input/TextArea';
import Label from '../../../components/form/Label';
import SpinnerOne from '../../../components/ui/spinner/SpinnerOne';
import { useLocation } from "react-router-dom";
import DepositoModal from './DepositoModal';

// Debounce function for user search
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function AccountTab({ userId, user }: { userId: string; user: any }) {
  // --- Account tab-specific state ---
  const [movements, setMovements] = useState<any[]>([]);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsTotalPages, setMovementsTotalPages] = useState(1);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [accountHoldings, setAccountHoldings] = useState<any[]>([]);
  const [movementTypes, setMovementTypes] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedMovementTypes, setSelectedMovementTypes] = useState<string[]>([]);
  const [operacionesOpen, setOperacionesOpen] = useState(false);
  // Modal state for operation
  const [operationModal, setOperationModal] = useState<{ type: string; open: boolean }>({ type: '', open: false });
  // Retiro modal state
  const [retiroForm, setRetiroForm] = useState({ importe: '', txHash: '', notas: '', internalAsset: '', tasaDeCambio: '1' });
  const [retiroLoading, setRetiroLoading] = useState(false);
  const [retiroError, setRetiroError] = useState<string | null>(null);
  const [retiroSuccess, setRetiroSuccess] = useState(false);
  const [retiroAvailableBalance, setRetiroAvailableBalance] = useState<number | null>(null);
  const [internalHoldings, setInternalHoldings] = useState<any[]>([]);
  const [retiroFxUsdLoading, setRetiroFxUsdLoading] = useState(false);
  const [retiroFxUsdDisabled, setRetiroFxUsdDisabled] = useState(false);
  // Transfer modal state
  const [transferForm, setTransferForm] = useState({ userEmail: '', userId: '', importe: '', notas: '', externalAsset: '', tasaDeCambio: '1' });
  const [transferUserOptions, setTransferUserOptions] = useState<{ id: string; email: string; name: string }[]>([]);
  const [transferUserLoading, setTransferUserLoading] = useState(false);
  const [transferUserDropdownOpen, setTransferUserDropdownOpen] = useState(false);
  const transferUserInputRef = useRef<HTMLInputElement>(null);
  const [transferAccountHoldings, setTransferAccountHoldings] = useState<any[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferAvailableBalance, setTransferAvailableBalance] = useState<number | null>(null);
  const [transferFxUsdDisabled, setTransferFxUsdDisabled] = useState(false);
  // Modal key for forcing effect re-run
  const [modalKey, setModalKey] = useState(0);

  // Flags for onboarding status
  const flags = [
    {
      label: user?.approvalStatusLabel || "Unknown",
      value: user?.approvalStatusCode === "approved",
      color:
        user?.approvalStatusCode === "approved"
          ? "success"
          : user?.approvalStatusCode === "declined"
          ? "error"
          : user?.approvalStatusCode === "unverified"
          ? "gray"
          : user?.approvalStatusCode === "ready"
          ? "emerald"
          : "warning",
    },
    { label: "AML", value: user?.onboardingStatus?.aml_form_completed },
    { label: "KYC", value: user?.onboardingStatus?.kyc_completed },
    { label: "Agreement Signed", value: user?.onboardingStatus?.agreement_signed },
    { label: "Email Verified", value: user?.onboardingStatus?.emailVerified },
    { label: "Phone Verified", value: user?.onboardingStatus?.phoneVerified },
    { label: "Risk Profile", value: user?.onboardingStatus?.risk_profile_completed },
    { label: "Profile Completed", value: user?.onboardingStatus?.profile_completed },
  ];

  // Debounced user search for transfer
  const debouncedSearchUsers = useRef(
    debounce(async (query: string) => {
      if (!query) {
        setTransferUserOptions([]);
        return;
      }
      setTransferUserLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      fetch(`http://localhost:3000/admin/users?search=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setTransferUserOptions(Array.isArray(data.data) ? data.data : []))
        .finally(() => setTransferUserLoading(false));
    }, 400)
  ).current;

  useEffect(() => {
    if (transferForm.userEmail) {
      debouncedSearchUsers(transferForm.userEmail);
      setTransferUserDropdownOpen(true);
    } else {
      setTransferUserOptions([]);
      setTransferUserDropdownOpen(false);
    }
  }, [transferForm.userEmail]);

  // --- Modal handlers and effects (move from ViewUser) ---
  // Example: handleDepositSubmit
  async function handleRetiroSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRetiroLoading(true);
    setRetiroError(null);
    setRetiroSuccess(false);
    try {
      // ...logic for retiro...
    } catch (err: any) {
      setRetiroError(err.message || 'Error desconocido');
    } finally {
      setRetiroLoading(false);
    }
  }
  async function handleTransferSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTransferLoading(true);
    setTransferError(null);
    setTransferSuccess(false);
    try {
      // ...logic for transfer...
    } catch (err: any) {
      setTransferError(err.message || 'Error desconocido');
    } finally {
      setTransferLoading(false);
    }
  }

  // --- Effects for fetching data ---
  useEffect(() => {
    if (!userId) return;
    setMovementsLoading(true);
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const params = new URLSearchParams({
      userId,
      displayHiddenHoldings: 'true',
      showInactiveHoldings: 'true',
      page: movementsPage.toString(),
    });
    selectedAccounts.forEach((id) => params.append('accountHoldingIds', id));
    selectedMovementTypes.forEach((id) => params.append('movementTypeIds', id));
    fetch(`http://localhost:3000/admin/account-movements/by-user?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const parsed = (data.data || []).map((item: any) => ({
          ...item,
          value_usd: item.value_usd !== undefined && item.value_usd !== null ? Number(item.value_usd) : undefined,
          units_after: item.units_after !== undefined && item.units_after !== null ? Number(item.units_after) : undefined,
          units_delta: item.units_delta !== undefined && item.units_delta !== null ? Number(item.units_delta) : undefined,
        }));
        setMovements(parsed);
        setMovementsTotalPages(data.totalPages || 1);
      })
      .catch(() => setMovements([]))
      .finally(() => setMovementsLoading(false));
  }, [userId, movementsPage, selectedAccounts, selectedMovementTypes]);

  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    fetch(`http://localhost:3000/admin/account-movements/user-holdings?userId=${userId}&withBalances=true`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setAccountHoldings(data || []));
    fetch(`http://localhost:3000/admin/account-movements/movement-types`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setMovementTypes(data || []));
  }, [userId]);

  // --- Modal JSX ---
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        {flags.map((flag) => (
          <span
            key={flag.label}
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border 
              ${flag.color === "success" ? "bg-success-100 text-success-700 border-success-200" : ""}
              ${flag.color === "error" ? "bg-error-100 text-error-700 border-error-200" : ""}
              ${flag.color === "warning" ? "bg-warning-100 text-warning-700 border-warning-200" : ""}
              ${flag.color === "gray" ? "bg-gray-100 text-gray-500 border-gray-200" : ""}
              ${flag.color === "emerald" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}
              ${flag.value === false && !flag.color ? "bg-error-100 text-error-700 border-error-200" : ""}
            `}
          >
            {flag.value !== undefined ? (
              flag.value ? (
                <svg className="w-3 h-3 mr-1 text-success-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-3 h-3 mr-1 text-error-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              )
            ) : null}
            {flag.label}
          </span>
        ))}
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end justify-between">
        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Accounts</label>
            <MultiSelectDropdown
              options={accountHoldings.map((ah: any) => ({ value: ah.account_holding_id, label: ah.holding_id?.name || ah.account_holding_id }))}
              selected={selectedAccounts}
              setSelected={setSelectedAccounts}
              allLabel="Todas"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo movimiento</label>
            <MultiSelectDropdown
              options={movementTypes.map((mt: any) => ({ value: String(mt.id), label: mt.name }))}
              selected={selectedMovementTypes}
              setSelected={setSelectedMovementTypes}
              allLabel="Todos"
            />
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            className="w-48 py-2 px-3 rounded-lg flex items-center justify-center gap-2 dropdown-toggle bg-brand-500 text-white hover:bg-brand-600 transition-colors"
            onClick={() => setOperacionesOpen((v: boolean) => !v)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            <span className="text-center flex-1">Operar</span>
            <svg className={`ml-2 transition-transform ${operacionesOpen ? "rotate-180" : ""}`} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.79199 7.396L10.0003 12.6043L15.2087 7.396" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <Dropdown isOpen={operacionesOpen} onClose={() => setOperacionesOpen(false)} className="left-0 w-48 mt-2">
            <ul className="flex flex-col gap-1">
              {movementTypes.map((mt: any) => (
                <li key={mt.id}>
                  <DropdownItem
                    onItemClick={() => {
                      setOperacionesOpen(false);
                      handleOpenOperationModal(mt.code);
                    }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    {mt.name}
                  </DropdownItem>
                </li>
              ))}
            </ul>
          </Dropdown>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <Table>
          <TableHeader className="border-gray-100 border-y dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="py-3 font-normal text-gray-500 text-start text-theme-sm dark:text-gray-400">Date</TableCell>
              <TableCell isHeader className="py-3 font-normal text-gray-500 text-start text-theme-sm dark:text-gray-400">Asset</TableCell>
              <TableCell isHeader className="py-3 font-normal text-gray-500 text-start text-theme-sm dark:text-gray-400">Movement Type</TableCell>
              <TableCell isHeader className="py-3 font-normal text-gray-500 text-start text-theme-sm dark:text-gray-400">USD value</TableCell>
              <TableCell isHeader className="py-3 font-normal text-gray-500 text-start text-theme-sm dark:text-gray-400">Credit</TableCell>
              <TableCell isHeader className="py-3 font-normal text-gray-500 text-start text-theme-sm dark:text-gray-400">Debit</TableCell>
              <TableCell isHeader className="py-3 font-normal text-gray-500 text-start text-theme-sm dark:text-gray-400">Balance</TableCell>
              <TableCell isHeader className="py-3 font-normal text-gray-500 text-start text-theme-sm dark:text-gray-400">Tx hash</TableCell>
              <TableCell isHeader className="py-3 font-normal text-gray-500 text-start text-theme-sm dark:text-gray-400">Notes</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {movementsLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-6 text-gray-400">Loading movements...</td>
              </tr>
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-6 text-gray-400">No movements found.</td>
              </tr>
            ) : (
              movements.map((item: any, idx: number) => (
                <TableRow key={item.movement_id || idx}>
                  <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-400 whitespace-nowrap">{new Date(item.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-400 whitespace-nowrap">{item.account_holding_id?.holding_id?.name || '-'}</TableCell>
                  <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-400 whitespace-nowrap">{item.movement_type_id?.name || '-'}</TableCell>
                  <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-400 whitespace-nowrap">{typeof item.value_usd === 'number' ? `$${Number(item.value_usd).toLocaleString()}` : '-'}</TableCell>
                  <TableCell className="py-3 text-green-600 font-semibold text-theme-sm dark:text-green-400 whitespace-nowrap">{item.units_delta > 0 ? `$${Number(item.units_delta).toLocaleString()}` : '-'}</TableCell>
                  <TableCell className="py-3 text-red-600 font-semibold text-theme-sm dark:text-red-400 whitespace-nowrap">{item.units_delta < 0 ? `$${Math.abs(Number(item.units_delta)).toLocaleString()}` : '-'}</TableCell>
                  <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-400 whitespace-nowrap">{typeof item.units_after === 'number' ? `$${Number(item.units_after).toLocaleString()}` : '-'}</TableCell>
                  <TableCell className="py-3 text-theme-sm whitespace-nowrap">
                    {item.tx_hash ? (
                      <a
                        href={`https://etherscan.io/tx/${item.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-500 underline hover:text-brand-700"
                        title={item.tx_hash}
                        onClick={e => {
                          e.preventDefault();
                          // setViewModal({ type: 'txHash', value: item.tx_hash! });
                        }}
                      >
                        {item.tx_hash.length > 8 ? `${item.tx_hash.slice(0, 3)}...${item.tx_hash.slice(-3)}` : item.tx_hash}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                    {item.notes && item.notes.length > 0 ? (
                      <button
                        className="text-xs text-gray-500 underline hover:text-brand-500"
                        onClick={e => { e.preventDefault(); /* setViewModal({ type: 'notes', value: item.notes! }); */ }}
                        type="button"
                      >
                        {item.notes.length > 8 ? `${item.notes.slice(0, 3)}...${item.notes.slice(-3)}` : item.notes}
                      </button>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end mt-4">
        <PaginationWithText totalPages={movementsTotalPages} currentPage={movementsPage} onPageChange={setMovementsPage} />
      </div>
      {/* Operation Modal: Deposito */}
      <DepositoModal
        isOpen={operationModal.open && operationModal.type === 'deposito'}
        onClose={() => setOperationModal({ type: '', open: false })}
        userId={userId}
        // Pass any other props needed for the modal to function (e.g., reload movements, etc)
      />
      {/* Operation Modal: Retiro */}
      <Modal isOpen={operationModal.open && operationModal.type === 'retiro'} onClose={() => setOperationModal({ type: '', open: false })} className="max-w-[420px] p-5 lg:p-8">
        <form onSubmit={handleRetiroSubmit}>
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">Retiro manual</h4>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5">
            {/* ...move retiro form fields here... */}
          </div>
          {/* ...move retiro error/success and buttons here... */}
        </form>
      </Modal>
      {/* Operation Modal: Transferencia */}
      <Modal isOpen={operationModal.open && operationModal.type === 'transferencia'} onClose={() => setOperationModal({ type: '', open: false })} className="max-w-[420px] p-5 lg:p-8">
        <form onSubmit={handleTransferSubmit}>
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">Transferencia</h4>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5">
            {/* ...move transfer form fields here... */}
          </div>
          {/* ...move transfer error/success and buttons here... */}
        </form>
      </Modal>
    </>
  );

  // Handler to open operation modal
  function handleOpenOperationModal(type: string) {
    setOperationModal({ type, open: true });
  }
} 