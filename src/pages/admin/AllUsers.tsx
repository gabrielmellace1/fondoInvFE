import { useEffect, useState, useCallback } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import Avatar from "../../components/ui/avatar/Avatar";
import AvatarText from "../../components/ui/avatar/AvatarText";
import ProgressBar from "../../components/ui/progressbar/ProgressBar";
import Button from "../../components/ui/button/Button";
import PaginationWithButton from "../../components/tables/DataTables/TableTwo/PaginationWithButton";
import { useNavigate } from "react-router-dom";

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
  onboardingStatus?: {
    profile_completed: boolean;
    risk_profile_completed: boolean;
    aml_form_completed: boolean;
    kyc_completed: boolean;
    agreement_signed: boolean;
    emailVerified?: boolean;
    phoneVerified?: boolean;
  };
  admin?: boolean;
  approvalStatus?: ApprovalStatus;
  approvalStatusCode?: string;
  approvalStatusLabel?: string;
}

type SortKey = "name" | "email" | "onboarding" | "verified";
type SortOrder = "asc" | "desc";

function getOnboardingProgress(status?: User["onboardingStatus"]): number {
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

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function AllUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
        sortKey,
        sortOrder: sortOrder.toUpperCase(),
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      const res = await fetch(`http://localhost:3000/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.data);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortKey, sortOrder, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  if (loading) return <div className="p-4">Loading users...</div>;
  if (error) return <div className="p-4 text-error-500">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">All Users</h1>
      <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
        {/* Top controls: entries per page and search */}
        <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 dark:text-gray-400"> Show </span>
            <div className="relative z-20 bg-transparent">
              <select
                className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[5, 8, 10].map((value) => (
                  <option
                    key={value}
                    value={value}
                    className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                  >
                    {value}
                  </option>
                ))}
              </select>
              <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
                <svg
                  className="stroke-current"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                    stroke=""
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400"> entries </span>
          </div>
          <div className="relative">
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none left-4 top-1/2 dark:text-gray-400">
              <svg
                className="fill-current"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                  fill=""
                />
              </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search..."
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
            />
          </div>
        </div>
        {/* Table */}
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-center"
                >
                  <div className="flex items-center justify-center gap-2 cursor-pointer" onClick={() => handleSort("name")}> 
                    <span>User</span>
                    <SortIcon active={sortKey === "name"} order={sortOrder} />
                  </div>
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-center"
                >
                  <div className="flex items-center justify-center gap-2 cursor-pointer" onClick={() => handleSort("onboarding")}> 
                    <span>Onboarding</span>
                    <SortIcon active={sortKey === "onboarding"} order={sortOrder} />
                  </div>
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-center"
                >
                  <div className="flex items-center justify-center gap-2 cursor-pointer" onClick={() => handleSort("email")}> 
                    <span>Email</span>
                    <SortIcon active={sortKey === "email"} order={sortOrder} />
                  </div>
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-center"
                >
                  <div className="flex items-center justify-center gap-2 cursor-pointer" onClick={() => handleSort("verified")}> 
                    <span>Verified</span>
                    <SortIcon active={sortKey === "verified"} order={sortOrder} />
                  </div>
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-center"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 overflow-hidden rounded-full">
                        {user.profileImageUrl ? (
                          <Avatar src={user.profileImageUrl} alt={user.name} size="small" />
                        ) : (
                          <AvatarText name={user.name} />
                        )}
                      </div>
                      <span className="block font-medium text-gray-800 dark:text-white/90">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-center min-w-[120px]">
                    <ProgressBar progress={getOnboardingProgress(user.onboardingStatus)} size="sm" label="inside" />
                  </TableCell>
                  <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-center">{user.email}</TableCell>
                  <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-center">
                    <span
                      className={
                        user.approvalStatusCode === "approved"
                          ? "text-success-600 font-semibold"
                          : user.approvalStatusCode === "declined"
                          ? "text-error-500 font-semibold"
                          : user.approvalStatusCode === "unverified"
                          ? "text-gray-400 font-semibold"
                          : user.approvalStatusCode === "ready"
                          ? "text-emerald-500 font-semibold"
                          : "text-warning-600 font-semibold"
                      }
                    >
                      {user.approvalStatusLabel || "Unknown"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-center">
                    <Button size="sm" onClick={() => navigate(`/admin/users/view?id=${user.id}`)}>View account</Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <td colSpan={5} className="text-center py-8 text-gray-400">No users found.</td>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination */}
        <div className="border border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
            <PaginationWithButton
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
            <div className="pt-3 xl:pt-0">
              <p className="pt-3 text-sm font-medium text-center text-gray-500 border-t border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-t-0 xl:pt-0 xl:text-left">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sort icon component
function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  return (
    <span className="flex flex-col gap-0.5">
      <svg
        className={`text-gray-300 dark:text-gray-700 ${active && order === "asc" ? "text-brand-500" : ""}`}
        width="8"
        height="5"
        viewBox="0 0 8 5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z"
          fill="currentColor"
        />
      </svg>
      <svg
        className={`text-gray-300 dark:text-gray-700 ${active && order === "desc" ? "text-brand-500" : ""}`}
        width="8"
        height="5"
        viewBox="0 0 8 5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
} 