import { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import Avatar from "../../components/ui/avatar/Avatar";
import AvatarText from "../../components/ui/avatar/AvatarText";
import ProgressBar from "../../components/ui/progressbar/ProgressBar";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import PaginationWithText from "../../components/ui/pagination/PaginationWithText";
import { MultiSelectDropdown } from "../../components/common/MultiSelectDropdown";
import { Modal } from '../../components/ui/modal';
import InputField from '../../components/form/input/InputField';
import TextArea from '../../components/form/input/TextArea';
import Label from '../../components/form/Label';
import SpinnerOne from '../../components/ui/spinner/SpinnerOne';
import TooltipExample from '../../components/ui/tooltip';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// --- Types ---
interface OnboardingStatus {
  profile_completed?: boolean;
  risk_profile_completed?: boolean;
  aml_form_completed?: boolean;
  kyc_completed?: boolean;
  agreement_signed?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

interface ApprovalStatus {
  code: string;
  label: string;
  description?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  profileImageUrl?: string;
  admin: boolean;
  approvalStatus?: ApprovalStatus;
  approvalStatusCode?: string;
  approvalStatusLabel?: string;
  createdAt: string;
  failedLoginAttempts: number;
  lockoutExpiresAt?: string;
  twoFactorSecret?: string;
  lastLoginIp?: string;
  lastLoginAt?: string;
  referral?: string;
  onboardingStatus?: OnboardingStatus;
}

// Add Movement type
interface Movement {
  movement_id: number;
  timestamp: string;
  account_holding_id?: { holding_id?: { name?: string } };
  movement_type_id?: { name?: string };
  value_usd?: number;
  units_delta: number;
  units_after?: number;
  tx_hash?: string;
  notes?: string;
}

// Tab icons
const AccountIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path fillRule="evenodd" clipRule="evenodd" d="M10 2a5 5 0 0 0-5 5v1a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Zm-3.5 5a3.5 3.5 0 1 1 7 0v1a3.5 3.5 0 1 1-7 0V7ZM4 16.5A3.5 3.5 0 0 1 7.5 13h5A3.5 3.5 0 0 1 16 16.5V18a1 1 0 1 1-2 0v-1.5a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 0 6 16.5V18a1 1 0 1 1-2 0v-1.5Z" fill="currentColor"/></svg>
);
const HoldingsIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M2.5 10a7.5 7.5 0 1 1 15 0 7.5 7.5 0 0 1-15 0Zm7.5-6a6 6 0 1 0 0 12A6 6 0 0 0 10 4Zm0 2a1 1 0 0 1 1 1v2h2a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" fill="currentColor"/></svg>
);
const ProfileIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M10 2a5 5 0 0 1 5 5v1a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3Zm-6 14a6 6 0 0 1 12 0v1a1 1 0 1 1-2 0v-1Z" fill="currentColor"/></svg>
);

const tabDefs = [
  { id: "account", label: "Account", icon: <AccountIcon /> },
  { id: "holdings", label: "Holdings", icon: <HoldingsIcon /> },
  { id: "profile", label: "Profile", icon: <ProfileIcon /> },
  { id: "documents", label: "Documents", icon: <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M6 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8.828a2 2 0 0 0-.586-1.414l-3.828-3.828A2 2 0 0 0 12.172 3H6Zm0 2h6v3a1 1 0 0 0 1 1h3v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4Zm8 3V4.414L16.586 7H14a1 1 0 0 1-1-1Z" fill="currentColor"/></svg> },
  { id: "requests", label: "Requests", icon: <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 14.5A6.5 6.5 0 1 1 10 3.5a6.5 6.5 0 0 1 0 13Zm-1-9a1 1 0 1 1 2 0v3a1 1 0 0 1-2 0V7.5Zm1 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" fill="currentColor"/></svg> },
  { id: "analytics", label: "Analytics", icon: <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M4 13a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1Zm5-6a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1Zm5 3a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Z" fill="currentColor"/></svg> },
];

function getOnboardingProgress(status?: OnboardingStatus): number {
  if (!status) return 0;
  const steps = [
    status.profile_completed,
    status.risk_profile_completed,
    status.aml_form_completed,
    status.kyc_completed,
    status.agreement_signed,
    status.emailVerified,
    status.phoneVerified,
  ];
  const completed = steps.filter(Boolean).length;
  return Math.round((completed / steps.length) * 100);
}

// Add a local debounce implementation:
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Define type for internalHoldings to match backend response
interface InternalHolding {
  account_holding_id: string;
  holding_id: { holding_id: number; name: string };
  balance: number;
}

export default function ViewUser() {
  const query = useQuery();
  const userId = query.get("id");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("account");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedMovementTypes, setSelectedMovementTypes] = useState<string[]>([]);
  const [operacionesOpen, setOperacionesOpen] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsTotalPages, setMovementsTotalPages] = useState(1);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [accountHoldings, setAccountHoldings] = useState<{ account_holding_id: string; holding_id: { name: string } }[]>([]);
  const [movementTypes, setMovementTypes] = useState<{ id: number; code: string; name: string }[]>([]);
  // Modal state for operation
  const [operationModal, setOperationModal] = useState<{ type: string; open: boolean }>({ type: '', open: false });
  const [depositForm, setDepositForm] = useState({ importe: '', txHash: '', notas: '', externalAsset: '', tasaDeCambio: '1' });
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState(false);
  // State for viewing full Tx Hash or Notes
  const [viewModal, setViewModal] = useState<{ type: 'txHash' | 'notes' | null, value: string }>({ type: null, value: '' });
  // Track if we've already jumped to the last page on initial load
  const hasJumpedToLastPage = useRef(false);
  // Add state for external holdings
  const [externalHoldings, setExternalHoldings] = useState<{ holding_id: number; name: string }[]>([]);
  const [retiroForm, setRetiroForm] = useState({ importe: '', txHash: '', notas: '', internalAsset: '', tasaDeCambio: '1' });
  const [retiroLoading, setRetiroLoading] = useState(false);
  const [retiroError, setRetiroError] = useState<string | null>(null);
  const [retiroSuccess, setRetiroSuccess] = useState(false);
  const [retiroAvailableBalance, setRetiroAvailableBalance] = useState<number | null>(null);
  // Update type for internalHoldings to match backend response
  const [internalHoldings, setInternalHoldings] = useState<InternalHolding[]>([]);
  const [fxUsdLoading, setFxUsdLoading] = useState(false);
  const [fxUsdDisabled, setFxUsdDisabled] = useState(false);
  const [retiroFxUsdLoading, setRetiroFxUsdLoading] = useState(false);
  const [retiroFxUsdDisabled, setRetiroFxUsdDisabled] = useState(false);
  // State for transfer modal
  const [transferForm, setTransferForm] = useState({
    userEmail: '',
    userId: '',
    importe: '',
    notas: '',
    externalAsset: '',
    tasaDeCambio: '1',
  });
  const [transferUserOptions, setTransferUserOptions] = useState<{ id: string; email: string; name: string }[]>([]);
  const [transferUserLoading, setTransferUserLoading] = useState(false);
  const [transferUserDropdownOpen, setTransferUserDropdownOpen] = useState(false);
  const transferUserInputRef = useRef<HTMLInputElement>(null);
  // Add state for accountId and transferAccountHoldings
  const [transferAccountId, setTransferAccountId] = useState<string | null>(null);
  const [transferAccountHoldings, setTransferAccountHoldings] = useState<any[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  // Add a modalKey to force effect re-run
  const [modalKey, setModalKey] = useState(0);
  // Add state for the viewed user's accountId
  const [viewedAccountId, setViewedAccountId] = useState<string | null>(null);
  const [conversionForm, setConversionForm] = useState({ fromAsset: '', toAsset: '', importe: '', tasaDeCambio: '', txHash: '', notas: '' });
  const [transferAvailableBalance, setTransferAvailableBalance] = useState<number | null>(null);
  const [transferFxUsdDisabled, setTransferFxUsdDisabled] = useState(false);

  // Update dropdown open logic to increment modalKey
  const handleOpenOperationModal = (type: string) => {
    setOperationModal({ type, open: true });
    setModalKey(k => k + 1);
  };

  // Debounced user search
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

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    fetch(`http://localhost:3000/admin/users?id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        if (data && data.account && data.account.id) {
          setViewedAccountId(data.account.id);
        } else {
          setViewedAccountId(null);
        }
      })
      .catch((err) => setError(err.message || "Unknown error"))
      .finally(() => setLoading(false));
  }, [userId]);

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
        // On first load, jump to last page if needed
        if (!hasJumpedToLastPage.current && movementsPage === 1 && data.totalPages > 1) {
          hasJumpedToLastPage.current = true;
          setMovementsPage(data.totalPages);
        }
      })
      .catch(() => setMovements([]))
      .finally(() => setMovementsLoading(false));
  }, [userId, movementsPage, selectedAccounts, selectedMovementTypes]);

  // Fetch external holdings when deposit modal opens
  useEffect(() => {
    if (operationModal.open && operationModal.type === 'deposito') {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      fetch('http://localhost:3000/admin/account-movements/holdings?hasExternalPair=true', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setExternalHoldings(data || []));
    }
  }, [operationModal]);

  // Fetch withdrawable holdings when retiro modal opens
  useEffect(() => {
    if (operationModal.open && operationModal.type === 'retiro' && userId) {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      fetch(`http://localhost:3000/admin/account-movements/user-holdings?userId=${userId}&onlyVisible=true&onlyWithBalance=true&hasExternalPair=true&withBalances=true&subtractPendingRequests=true`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setInternalHoldings(data || []));
    }
  }, [operationModal, userId]);

  // Fetch price and staticPrice for selected internal asset in retiro modal
  useEffect(() => {
    if (operationModal.open && operationModal.type === 'retiro' && retiroForm.internalAsset) {
      setRetiroFxUsdLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      // Find the selected holding by account_holding_id
      const selected = internalHoldings.find(h => h.account_holding_id === retiroForm.internalAsset);
      const holdingId = selected ? selected.holding_id.holding_id : '';
      if (holdingId) {
        // Fetch price/staticPrice from new /holdings endpoint
        fetch(`http://localhost:3000/admin/account-movements/holdings?holding_id=${holdingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(data => {
            const holding = Array.isArray(data) ? data[0] : null;
            if (holding && typeof holding.price === 'number') {
              setRetiroForm(f => ({ ...f, tasaDeCambio: holding.price.toString() }));
            }
            setRetiroFxUsdDisabled(!!(holding && holding.staticPrice));
          })
          .finally(() => setRetiroFxUsdLoading(false));
        // Fetch available balance using user-holdings endpoint
        if (userId) {
          fetch(`http://localhost:3000/admin/account-movements/user-holdings?userId=${userId}&withBalances=true&holdingId=${holdingId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(res => res.json())
            .then(data => {
              const ah = Array.isArray(data) ? data[0] : null;
              setRetiroAvailableBalance(ah && typeof ah.balance === 'number' ? ah.balance : null);
            });
        }
      } else {
        setRetiroFxUsdLoading(false);
        setRetiroAvailableBalance(null);
      }
    } else {
      setRetiroAvailableBalance(null);
    }
  }, [operationModal, retiroForm.internalAsset]);

  // Add effect to fetch price when asset changes (deposit modal)
  useEffect(() => {
    if (!depositForm.externalAsset) return;
    setFxUsdLoading(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    fetch(`http://localhost:3000/admin/account-movements/holdings?holding_id=${depositForm.externalAsset}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const holding = Array.isArray(data) ? data[0] : null;
        if (holding && typeof holding.price === 'number') {
          setDepositForm(f => ({ ...f, tasaDeCambio: holding.price.toString() }));
        }
        setFxUsdDisabled(!!(holding && holding.staticPrice));
      })
      .finally(() => setFxUsdLoading(false));
  }, [depositForm.externalAsset]);

  // Fetch transferable holdings when transferencia modal opens
  useEffect(() => {
    if (operationModal.open && operationModal.type === 'transferencia' && userId) {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      fetch(`http://localhost:3000/admin/account-movements/user-holdings?userId=${userId}&onlyVisible=true&onlyWithBalance=true&hasExternalPair=false&withBalances=true&subtractPendingRequests=true`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setTransferAccountHoldings(data || []));
    } else if (!operationModal.open || operationModal.type !== 'transferencia') {
      setTransferAccountHoldings([]);
    }
  }, [operationModal, userId, modalKey]);

  // Fetch available balance for selected asset in transferencia modal
  useEffect(() => {
    if (operationModal.open && operationModal.type === 'transferencia' && transferForm.externalAsset) {
      setTransferAvailableBalance(null);
      setTransferFxUsdDisabled(false);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      // Find the selected holding by account_holding_id (for transfer, we use holding_id)
      const selected = transferAccountHoldings.find(h => h.holding_id.holding_id.toString() === transferForm.externalAsset);
      const holdingId = selected ? selected.holding_id.holding_id : '';
      if (holdingId && userId) {
        // Fetch available balance using user-holdings endpoint
        fetch(`http://localhost:3000/admin/account-movements/user-holdings?userId=${userId}&withBalances=true&holdingId=${holdingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(data => {
            const ah = Array.isArray(data) ? data[0] : null;
            setTransferAvailableBalance(ah && typeof ah.balance === 'number' ? ah.balance : null);
          });
        // Fetch price/staticPrice from new /holdings endpoint
        fetch(`http://localhost:3000/admin/account-movements/holdings?holding_id=${holdingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(data => {
            const holding = Array.isArray(data) ? data[0] : null;
            if (holding && typeof holding.price === 'number') {
              setTransferForm(f => ({ ...f, tasaDeCambio: holding.price.toString() }));
            }
            setTransferFxUsdDisabled(!!(holding && holding.staticPrice));
            if (holding && holding.staticPrice) {
              setTransferForm(f => ({ ...f, tasaDeCambio: '1' }));
            }
          });
      } else {
        setTransferAvailableBalance(null);
        setTransferFxUsdDisabled(false);
      }
    } else {
      setTransferAvailableBalance(null);
      setTransferFxUsdDisabled(false);
    }
  }, [operationModal, transferForm.externalAsset, userId, transferAccountHoldings]);

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

  async function handleDepositSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDepositLoading(true);
    setDepositError(null);
    setDepositSuccess(false);
    try {
      // Get movementTypeId for 'deposito'
      const depositoType = movementTypes.find(mt => mt.code === 'deposito');
      if (!depositoType) throw new Error('Tipo de movimiento "deposito" no encontrado');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('http://localhost:3000/admin/account-movements/manual-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: userId,
          amount: Number(depositForm.importe),
          movementTypeId: depositoType.id,
          txHash: depositForm.txHash,
          notes: depositForm.notas,
          assetProvidedId: Number(depositForm.externalAsset),
          price_usd: Number(depositForm.tasaDeCambio),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.message ||
          err.error ||
          res.statusText ||
          'Error al crear el depósito'
        );
      }
      setDepositSuccess(true);
      setDepositForm({ importe: '', txHash: '', notas: '', externalAsset: '', tasaDeCambio: '1' });
      setTimeout(() => {
        setOperationModal({ type: '', open: false });
        setDepositSuccess(false);
      }, 1200);
    } catch (err: any) {
      setDepositError(err.message || 'Error desconocido');
    } finally {
      setDepositLoading(false);
    }
  }

  async function handleRetiroSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRetiroLoading(true);
    setRetiroError(null);
    setRetiroSuccess(false);
    try {
      if (!retiroForm.internalAsset) throw new Error('Seleccione un activo');
      if (!retiroForm.importe || isNaN(Number(retiroForm.importe))) throw new Error('Ingrese un importe válido');
      const retiroType = movementTypes.find(mt => mt.code === 'retiro');
      if (!retiroType) throw new Error('Tipo de movimiento "retiro" no encontrado');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      // Find the selected holding by account_holding_id
      const selected = internalHoldings.find(h => h.account_holding_id === retiroForm.internalAsset);
      if (!selected) throw new Error('Activo seleccionado no encontrado');
      const res = await fetch('http://localhost:3000/admin/account-movements/manual-withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: userId,
          amount: Number(retiroForm.importe),
          movementTypeId: retiroType.id,
          txHash: retiroForm.txHash,
          notes: retiroForm.notas,
          assetProvidedId: selected.holding_id.holding_id, // use holding_id (number)
          price_usd: Number(retiroForm.tasaDeCambio),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.message ||
          err.error ||
          res.statusText ||
          'Error al crear el retiro'
        );
      }
      setRetiroSuccess(true);
      setRetiroForm({ importe: '', txHash: '', notas: '', internalAsset: '', tasaDeCambio: '1' });
      setTimeout(() => {
        setOperationModal({ type: '', open: false });
        setRetiroSuccess(false);
      }, 1200);
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
      if (!userId || !transferForm.userId || !transferForm.externalAsset || !transferForm.importe || !transferForm.tasaDeCambio || !user || !transferForm.userEmail) {
        throw new Error('Complete todos los campos requeridos');
      }
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('http://localhost:3000/admin/account-movements/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderUserId: userId,
          receiverUserId: transferForm.userId,
          holdingId: Number(transferForm.externalAsset),
          amount: Number(transferForm.importe),
          price_usd: Number(transferForm.tasaDeCambio),
          senderEmail: user.email,
          receiverEmail: transferForm.userEmail,
          txHash: '',
          notes: transferForm.notas,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.message || err.error || res.statusText || 'Error al realizar la transferencia'
        );
      }
      setTransferSuccess(true);
      setTransferForm({ userEmail: '', userId: '', importe: '', notas: '', externalAsset: '', tasaDeCambio: '1' });
      setTimeout(() => {
        setOperationModal({ type: '', open: false });
        setTransferSuccess(false);
      }, 1200);
    } catch (err: any) {
      setTransferError(err.message || 'Error desconocido');
    } finally {
      setTransferLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/admin/users" className="hover:underline flex items-center gap-1">
            Users
            <svg className="stroke-current" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366" stroke="" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <span className="text-gray-800 dark:text-white/90">View User</span>
        </nav>
      </div>
      {loading ? (
        <div className="text-gray-500">Loading user...</div>
      ) : error ? (
        <div className="text-error-500">{error}</div>
      ) : user ? (
        <>
          {/* Profile Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] mb-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
              <div className="flex-shrink-0">
                {user.profileImageUrl ? (
                  <Avatar src={user.profileImageUrl} alt={user.name} size="large" />
                ) : (
                  <AvatarText name={user.name || "User"} className="h-16 w-16 text-xl" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center md:gap-4 justify-between">
                  <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 whitespace-nowrap">{user.name}</h2>
                    <span className="text-gray-400 text-sm whitespace-nowrap">{user.email}</span>
                  </div>
                  {user.approvalStatusCode === "ready" && (
                    <div className="flex gap-2 mt-3 md:mt-0 md:ml-auto">
                      <Button className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white">Approve</Button>
                      <Button className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white">Decline</Button>
                    </div>
                  )}
                </div>
                <div className="mt-2 max-w-xs">
                  <ProgressBar progress={getOnboardingProgress(user.onboardingStatus)} size="md" label="inside" />
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
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
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border border-gray-200 rounded-xl dark:border-gray-800 bg-white dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 dark:border-gray-800">
              <nav className="flex space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-600 px-6 pt-4">
                {tabDefs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`inline-flex items-center gap-2 border-b-2 px-2.5 py-2 text-sm font-medium transition-colors duration-200 ${
                      activeTab === tab.id
                        ? "text-brand-500 border-brand-500 dark:text-brand-400 dark:border-brand-400"
                        : "text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="pt-6 px-6 pb-8">
              {activeTab === "account" && (
                <>
                  <div className="flex flex-col md:flex-row gap-4 mb-6 items-end justify-between">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Accounts</label>
                        <MultiSelectDropdown
                          options={accountHoldings.map(ah => ({ value: ah.account_holding_id, label: ah.holding_id?.name || ah.account_holding_id }))}
                          selected={selectedAccounts}
                          setSelected={setSelectedAccounts}
                          allLabel="Todas"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo movimiento</label>
                        <MultiSelectDropdown
                          options={movementTypes.map(mt => ({ value: String(mt.id), label: mt.name }))}
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
                        onClick={() => setOperacionesOpen((v) => !v)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        <span className="text-center flex-1">Operar</span>
                        <svg className={`ml-2 transition-transform ${operacionesOpen ? "rotate-180" : ""}`} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.79199 7.396L10.0003 12.6043L15.2087 7.396" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <Dropdown isOpen={operacionesOpen} onClose={() => setOperacionesOpen(false)} className="left-0 w-48 mt-2">
                        <ul className="flex flex-col gap-1">
                          {movementTypes.map((mt) => (
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
                          movements.map((item, idx) => (
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
                                      setViewModal({ type: 'txHash', value: item.tx_hash! });
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
                                    onClick={e => { e.preventDefault(); setViewModal({ type: 'notes', value: item.notes! }); }}
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
                </>
              )}
              {activeTab !== "account" && (
                <div className="text-gray-400 text-sm">{activeTab} content coming soon...</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-gray-500">User not found.</div>
      )}
      {/* Operation Modal: Deposito */}
      <Modal isOpen={operationModal.open && operationModal.type === 'deposito'} onClose={() => setOperationModal({ type: '', open: false })} className="max-w-[420px] p-5 lg:p-8">
        <form onSubmit={handleDepositSubmit}>
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">Depósito manual</h4>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5">
            <div>
              <Label htmlFor="externalAsset">Activo externo</Label>
              <select
                id="externalAsset"
                name="externalAsset"
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={depositForm.externalAsset || ''}
                onChange={e => setDepositForm(f => ({ ...f, externalAsset: e.target.value }))}
                required
              >
                <option value="" disabled>Seleccione un activo</option>
                {externalHoldings.map(h => (
                  <option key={h.holding_id} value={h.holding_id}>{h.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col md:flex-row gap-x-6">
              <div className="flex-1">
                <Label htmlFor="importe">Importe</Label>
                <InputField
                  type="number"
                  name="importe"
                  id="importe"
                  placeholder="Ingrese el importe"
                  value={depositForm.importe ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val) || val === '') {
                      setDepositForm(f => ({ ...f, importe: val }));
                    }
                  }}
                  required
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="flex-1 relative flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="tasaDeCambio" className="mb-0">FX USD</Label>
                  {/* Tooltip top */}
                  <div className="relative inline-block group">
                    <button type="button" className="ml-1 cursor-pointer p-0 bg-transparent border-0 align-middle">
                      <svg width="16" height="16" fill="none" viewBox="0 0 20 20" className="text-gray-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="white"/><text x="10" y="15" textAnchor="middle" fontSize="12" fill="currentColor">?</text></svg>
                    </button>
                    <div className="invisible absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:visible group-hover:opacity-100 z-10">
                      <div className="relative">
                        <div className="drop-shadow-4xl whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 dark:bg-[#1E2634] dark:text-white">
                          Ingrese aqui cuantos dolares vale una unidad de lo que esta ingresando
                        </div>
                        <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-white dark:bg-[#1E2634]"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <InputField
                    type="number"
                    name="tasaDeCambio"
                    id="tasaDeCambio"
                    placeholder="Ingrese el valor en USD de 1 unidad"
                    value={depositForm.tasaDeCambio ?? ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (/^\d*\.?\d*$/.test(val) || val === '') {
                        setDepositForm(f => ({ ...f, tasaDeCambio: val }));
                      }
                    }}
                    required
                    min={0}
                    step={0.0001}
                    disabled={fxUsdLoading || fxUsdDisabled}
                    className="max-w-[110px]"
                  />
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                    onClick={() => {
                      const val = parseFloat(depositForm.tasaDeCambio);
                      if (val > 0) setDepositForm(f => ({ ...f, tasaDeCambio: (1 / val).toFixed(8) }));
                    }}
                    title="Invertir valor"
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M7 7h10M7 7l3-3m-3 3l3 3M17 17H7m10 0l-3 3m3-3l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  {fxUsdLoading && <span className="ml-2"><SpinnerOne /></span>}
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="txHash">Tx hash</Label>
              <InputField
                type="text"
                name="txHash"
                id="txHash"
                placeholder="Ingrese el hash de la transacción"
                value={depositForm.txHash}
                onChange={e => setDepositForm(f => ({ ...f, txHash: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="notas">Notas</Label>
              <TextArea
                placeholder="Notas adicionales"
                value={depositForm.notas}
                onChange={val => setDepositForm(f => ({ ...f, notas: val }))}
                rows={3}
              />
            </div>
          </div>
          {depositError && <div className="mt-4 text-error-500 text-sm">{depositError}</div>}
          {depositSuccess && <div className="mt-4 text-success-600 text-sm">Depósito realizado con éxito</div>}
          <div className="flex items-center justify-end w-full gap-3 mt-6">
            <Button type="button" size="sm" variant="outline" onClick={() => setOperationModal({ type: '', open: false })} disabled={depositLoading}>Cancelar</Button>
            <Button type="submit" size="sm" className="bg-brand-500 text-white" disabled={depositLoading}>
              {depositLoading ? <><span className="w-4 h-4 mr-2 inline-block align-middle"><SpinnerOne /></span>Procesando...</> : 'Confirmar'}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Operation Modal: Retiro */}
      <Modal isOpen={operationModal.open && operationModal.type === 'retiro'} onClose={() => setOperationModal({ type: '', open: false })} className="max-w-[420px] p-5 lg:p-8">
        <form onSubmit={handleRetiroSubmit}>
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">Retiro manual</h4>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5">
            <div>
              <Label htmlFor="internalAsset">Activo interno</Label>
              <select
                id="internalAsset"
                name="internalAsset"
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={retiroForm.internalAsset || ''}
                onChange={e => setRetiroForm(f => ({ ...f, internalAsset: e.target.value }))}
                required
              >
                <option value="" disabled>Seleccione un activo</option>
                {internalHoldings.map(h => (
                  <option key={h.account_holding_id} value={h.account_holding_id}>
                    {h.holding_id.name} {typeof h.balance === 'number' ? `(Disponible: ${h.balance})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col md:flex-row gap-x-6">
              <div className="flex-1">
                <Label htmlFor="importe">Importe</Label>
                <InputField
                  type="number"
                  name="importe"
                  id="importe"
                  placeholder="Ingrese el importe"
                  value={retiroForm.importe ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val) || val === '') {
                      setRetiroForm(f => ({ ...f, importe: val }));
                    }
                  }}
                  required
                  min={0}
                  step={0.01}
                />
                {retiroAvailableBalance !== null && (
                  <div className="text-xs text-gray-500 mt-1">Disponible: {retiroAvailableBalance}</div>
                )}
              </div>
              <div className="flex-1 relative flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="tasaDeCambio" className="mb-0">FX USD</Label>
                  {/* Tooltip top */}
                  <div className="relative inline-block group">
                    <button type="button" className="ml-1 cursor-pointer p-0 bg-transparent border-0 align-middle">
                      <svg width="16" height="16" fill="none" viewBox="0 0 20 20" className="text-gray-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="white"/><text x="10" y="15" textAnchor="middle" fontSize="12" fill="currentColor">?</text></svg>
                    </button>
                    <div className="invisible absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:visible group-hover:opacity-100 z-10">
                      <div className="relative">
                        <div className="drop-shadow-4xl whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 dark:bg-[#1E2634] dark:text-white">
                          Ingrese aqui cuantos dolares vale una unidad de lo que esta ingresando
                        </div>
                        <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-white dark:bg-[#1E2634]"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <InputField
                    type="number"
                    name="tasaDeCambio"
                    id="tasaDeCambio"
                    placeholder="Ingrese el valor en USD de 1 unidad"
                    value={retiroForm.tasaDeCambio ?? ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (/^\d*\.?\d*$/.test(val) || val === '') {
                        setRetiroForm(f => ({ ...f, tasaDeCambio: val }));
                      }
                    }}
                    required
                    min={0}
                    step={0.0001}
                    disabled={retiroFxUsdLoading || retiroFxUsdDisabled}
                    className="max-w-[110px]"
                  />
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                    onClick={() => {
                      const val = parseFloat(retiroForm.tasaDeCambio);
                      if (val > 0) setRetiroForm(f => ({ ...f, tasaDeCambio: (1 / val).toFixed(8) }));
                    }}
                    title="Invertir valor"
                    disabled={retiroFxUsdLoading || retiroFxUsdDisabled}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M7 7h10M7 7l3-3m-3 3l3 3M17 17H7m10 0l-3 3m3-3l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  {retiroFxUsdLoading && <span className="ml-2"><SpinnerOne /></span>}
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="txHash">Tx hash</Label>
              <InputField
                type="text"
                name="txHash"
                id="txHash"
                placeholder="Ingrese el hash de la transacción"
                value={retiroForm.txHash}
                onChange={e => setRetiroForm(f => ({ ...f, txHash: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="notas">Notas</Label>
              <TextArea
                placeholder="Notas adicionales"
                value={retiroForm.notas}
                onChange={val => setRetiroForm(f => ({ ...f, notas: val }))}
                rows={3}
              />
            </div>
          </div>
          {retiroError && <div className="mt-4 text-error-500 text-sm">{retiroError}</div>}
          {retiroSuccess && <div className="mt-4 text-success-600 text-sm">Retiro realizado con éxito</div>}
          <div className="flex items-center justify-end w-full gap-3 mt-6">
            <Button type="button" size="sm" variant="outline" onClick={() => setOperationModal({ type: '', open: false })} disabled={retiroLoading}>Cancelar</Button>
            <Button type="submit" size="sm" className="bg-brand-500 text-white" disabled={retiroLoading}>
              {retiroLoading ? <><span className="w-4 h-4 mr-2 inline-block align-middle"><SpinnerOne /></span>Procesando...</> : 'Confirmar'}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Modal for full Tx Hash or Notes */}
      <Modal isOpen={!!viewModal.type} onClose={() => setViewModal({ type: null, value: '' })} className="max-w-[420px] p-5 lg:p-8">
        <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          {viewModal.type === 'txHash' ? 'Tx Hash completo' : viewModal.type === 'notes' ? 'Notas completas' : ''}
        </h4>
        <div className="break-all text-gray-700 dark:text-gray-200 text-sm">
          {viewModal.value}
        </div>
        <div className="flex items-center justify-end w-full gap-3 mt-6">
          <Button type="button" size="sm" variant="outline" onClick={() => setViewModal({ type: null, value: '' })}>Cerrar</Button>
        </div>
      </Modal>
      {/* Operation Modal: Transferencia */}
      <Modal isOpen={operationModal.open && operationModal.type === 'transferencia'} onClose={() => setOperationModal({ type: '', open: false })} className="max-w-[420px] p-5 lg:p-8">
        <form onSubmit={handleTransferSubmit}>
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">Transferencia</h4>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5">
            {/* User search input */}
            <div className="relative">
              <Label htmlFor="transferUserSearch">Usuario destino (email)</Label>
              <input
                ref={transferUserInputRef}
                type="text"
                id="transferUserSearch"
                name="transferUserSearch"
                className="w-full border rounded-lg px-3 py-2 mt-1"
                placeholder="Buscar usuario por email"
                autoComplete="new-password"
                value={transferForm.userEmail}
                onChange={e => {
                  setTransferForm(f => ({ ...f, userEmail: e.target.value, userId: '' }));
                }}
                onFocus={() => setTransferUserDropdownOpen(true)}
                onBlur={() => setTimeout(() => setTransferUserDropdownOpen(false), 200)}
              />
              {transferUserDropdownOpen && transferForm.userEmail && (
                <div className="absolute left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 mt-1 max-h-48 overflow-y-auto">
                  {transferUserLoading ? (
                    <div className="p-2 text-gray-500 text-sm">Buscando...</div>
                  ) : transferUserOptions.length === 0 ? (
                    <div className="p-2 text-gray-500 text-sm">No se encontraron usuarios</div>
                  ) : (
                    transferUserOptions.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        className={`w-full text-left px-3 py-2 hover:bg-brand-50 ${transferForm.userId === u.id ? 'bg-brand-100' : ''}`}
                        onClick={() => {
                          setTransferForm(f => ({ ...f, userEmail: u.email, userId: u.id }));
                          setTransferUserDropdownOpen(false);
                        }}
                      >
                        <span className="font-medium">{u.email}</span>
                        {u.name && <span className="ml-2 text-xs text-gray-400">{u.name}</span>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {/* Asset selection dropdown (use account holdings) */}
            <div>
              <Label htmlFor="internalAsset">Activo</Label>
              <select
                id="internalAsset"
                name="internalAsset"
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={transferForm.externalAsset || ''}
                onChange={e => setTransferForm(f => ({ ...f, externalAsset: e.target.value }))}
                required
              >
                <option value="" disabled>Seleccione un activo</option>
                {transferAccountHoldings.map(h => (
                  <option key={h.account_holding_id} value={h.holding_id.holding_id}>{h.holding_id.name}</option>
                ))}
              </select>
            </div>
            {/* Importe and FX USD side by side (same as deposito) */}
            <div className="flex flex-col md:flex-row gap-x-6">
              <div className="flex-1">
                <Label htmlFor="importe">Importe</Label>
                <InputField
                  type="number"
                  name="importe"
                  id="importe"
                  placeholder="Ingrese el importe"
                  value={transferForm.importe ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val) || val === '') {
                      setTransferForm(f => ({ ...f, importe: val }));
                    }
                  }}
                  required
                  min={0}
                  step={0.01}
                />
                {transferAvailableBalance !== null && (
                  <div className="text-xs text-gray-500 mt-1">Disponible: {transferAvailableBalance}</div>
                )}
              </div>
              <div className="flex-1 relative flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="tasaDeCambio" className="mb-0">FX USD</Label>
                  {/* Tooltip top */}
                  <div className="relative inline-block group">
                    <button type="button" className="ml-1 cursor-pointer p-0 bg-transparent border-0 align-middle">
                      <svg width="16" height="16" fill="none" viewBox="0 0 20 20" className="text-gray-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="white"/><text x="10" y="15" textAnchor="middle" fontSize="12" fill="currentColor">?</text></svg>
                    </button>
                    <div className="invisible absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:visible group-hover:opacity-100 z-10">
                      <div className="relative">
                        <div className="drop-shadow-4xl whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 dark:bg-[#1E2634] dark:text-white">
                          Ingrese aqui cuantos dolares vale una unidad de lo que esta ingresando
                        </div>
                        <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-white dark:bg-[#1E2634]"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <InputField
                    type="number"
                    name="tasaDeCambio"
                    id="tasaDeCambio"
                    placeholder="Ingrese el valor en USD de 1 unidad"
                    value={transferForm.tasaDeCambio ?? ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (/^\d*\.?\d*$/.test(val) || val === '') {
                        setTransferForm(f => ({ ...f, tasaDeCambio: val }));
                      }
                    }}
                    required
                    min={0}
                    step={0.0001}
                    className="max-w-[110px]"
                    disabled={transferFxUsdDisabled}
                  />
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                    onClick={() => {
                      const val = parseFloat(transferForm.tasaDeCambio);
                      if (val > 0) setTransferForm(f => ({ ...f, tasaDeCambio: (1 / val).toFixed(8) }));
                    }}
                    title="Invertir valor"
                    disabled={transferFxUsdDisabled}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M7 7h10M7 7l3-3m-3 3l3 3M17 17H7m10 0l-3 3m3-3l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="notas">Notas</Label>
              <TextArea
                placeholder="Notas adicionales"
                value={transferForm.notas}
                onChange={val => setTransferForm(f => ({ ...f, notas: val }))}
                rows={3}
              />
            </div>
          </div>
          {transferError && <div className="mt-4 text-error-500 text-sm">{transferError}</div>}
          {transferSuccess && <div className="mt-4 text-success-600 text-sm">Transferencia realizada con éxito</div>}
          <div className="flex items-center justify-end w-full gap-3 mt-6">
            <Button type="button" size="sm" variant="outline" onClick={() => setOperationModal({ type: '', open: false })} disabled={transferLoading}>Cancelar</Button>
            <Button type="submit" size="sm" className="bg-brand-500 text-white" disabled={transferLoading}>
              {transferLoading ? <><span className="w-4 h-4 mr-2 inline-block align-middle"><SpinnerOne /></span>Procesando...</> : 'Confirmar'}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Operation Modal: Conversión */}
      <Modal isOpen={operationModal.open && operationModal.type === 'conversion'} onClose={() => setOperationModal({ type: '', open: false })} className="max-w-[420px] p-5 lg:p-8">
        <form /* onSubmit={handleConversionSubmit} */>
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">Conversión de activos</h4>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5">
            <div>
              <Label htmlFor="conversionFromAsset">Activo origen</Label>
              <select
                id="conversionFromAsset"
                name="conversionFromAsset"
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={conversionForm.fromAsset || ''}
                onChange={e => setConversionForm(f => ({ ...f, fromAsset: e.target.value }))}
                required
              >
                <option value="" disabled>Seleccione un activo</option>
                {/* TODO: Populate with eligible holdings */}
              </select>
            </div>
            <div>
              <Label htmlFor="conversionToAsset">Activo destino</Label>
              <select
                id="conversionToAsset"
                name="conversionToAsset"
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={conversionForm.toAsset || ''}
                onChange={e => setConversionForm(f => ({ ...f, toAsset: e.target.value }))}
                required
              >
                <option value="" disabled>Seleccione un activo</option>
                {/* TODO: Populate with eligible destination holdings */}
              </select>
            </div>
            <div className="flex flex-col md:flex-row gap-x-6">
              <div className="flex-1">
                <Label htmlFor="importe">Importe</Label>
                <InputField
                  type="number"
                  name="importe"
                  id="importe"
                  placeholder="Ingrese el importe"
                  value={conversionForm.importe}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val) || val === '') {
                      setConversionForm(f => ({ ...f, importe: val }));
                    }
                  }}
                  required
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="flex-1 relative flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="tasaDeCambio" className="mb-0">FX USD</Label>
                  {/* Tooltip top */}
                  <div className="relative inline-block group">
                    <button type="button" className="ml-1 cursor-pointer p-0 bg-transparent border-0 align-middle">
                      <svg width="16" height="16" fill="none" viewBox="0 0 20 20" className="text-gray-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="white"/><text x="10" y="15" textAnchor="middle" fontSize="12" fill="currentColor">?</text></svg>
                    </button>
                    <div className="invisible absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:visible group-hover:opacity-100 z-10">
                      <div className="relative">
                        <div className="drop-shadow-4xl whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 dark:bg-[#1E2634] dark:text-white">
                          Ingrese aqui cuantos dolares vale una unidad de lo que esta ingresando
                        </div>
                        <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-white dark:bg-[#1E2634]"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <InputField
                    type="number"
                    name="tasaDeCambio"
                    id="tasaDeCambio"
                    placeholder="Ingrese el valor en USD de 1 unidad"
                    value={conversionForm.tasaDeCambio}
                    onChange={e => {
                      const val = e.target.value;
                      if (/^\d*\.?\d*$/.test(val) || val === '') {
                        setConversionForm(f => ({ ...f, tasaDeCambio: val }));
                      }
                    }}
                    required
                    min={0}
                    step={0.0001}
                    /* disabled={conversionFxUsdLoading || conversionFxUsdDisabled} */
                    className="max-w-[110px]"
                  />
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                    onClick={() => {
                      const val = parseFloat(conversionForm.tasaDeCambio);
                      if (val > 0) setConversionForm(f => ({ ...f, tasaDeCambio: (1 / val).toFixed(8) }));
                    }}
                    title="Invertir valor"
                    /* disabled={conversionFxUsdLoading || conversionFxUsdDisabled} */
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M7 7h10M7 7l3-3m-3 3l3 3M17 17H7m10 0l-3 3m3-3l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  {/* {conversionFxUsdLoading && <span className="ml-2"><SpinnerOne /></span>} */}
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="txHash">Tx hash</Label>
              <InputField
                type="text"
                name="txHash"
                id="txHash"
                placeholder="Ingrese el hash de la transacción"
                value={conversionForm.txHash}
                onChange={e => setConversionForm(f => ({ ...f, txHash: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="notas">Notas</Label>
              <TextArea
                placeholder="Notas adicionales"
                value={conversionForm.notas}
                onChange={val => setConversionForm(f => ({ ...f, notas: val }))}
                rows={3}
              />
            </div>
          </div>
          {/* {conversionError && <div className="mt-4 text-error-500 text-sm">{conversionError}</div>} */}
          {/* {conversionSuccess && <div className="mt-4 text-success-600 text-sm">Conversión realizada con éxito</div>} */}
          <div className="flex items-center justify-end w-full gap-3 mt-6">
            <Button type="button" size="sm" variant="outline" onClick={() => setOperationModal({ type: '', open: false })} /* disabled={conversionLoading} */>Cancelar</Button>
            <Button type="submit" size="sm" className="bg-brand-500 text-white" /* disabled={conversionLoading} */>
              {/* {conversionLoading ? <><span className="w-4 h-4 mr-2 inline-block align-middle"><SpinnerOne /></span>Procesando...</> : 'Confirmar'} */}
              Confirmar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );} 
